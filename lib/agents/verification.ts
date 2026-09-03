import "server-only";
import { listDnsRecords } from "@/lib/namecom";
import { buildDiscoveryTxtValue, DISCOVERY_TXT_HOST_PREFIX } from "./manifest";
import type { AgentDiscoveryRecord, AgentVerificationState } from "./types";

const ENDPOINT_CHECK_TIMEOUT_MS = 3500;

/** Where the discovery TXT record lives for a given publication point — "@" gets the bare prefix, a subdomain gets it nested under its label. */
export function discoveryTxtHost(publicationPoint: string): string {
  return publicationPoint === "@" ? DISCOVERY_TXT_HOST_PREFIX : `${DISCOVERY_TXT_HOST_PREFIX}.${publicationPoint}`;
}

/**
 * AgentVerifier — runs the checks LaunchName can actually perform and
 * reports exactly what each one found. No check here implies the others;
 * "domain ownership verified" says nothing about whether the endpoint is
 * live, and vice versa. There is deliberately no cryptographic-identity
 * check — this build doesn't implement one.
 */
export async function verifyAgent(agent: AgentDiscoveryRecord): Promise<AgentVerificationState> {
  const identityDeclared = Boolean(
    agent.name.trim() && agent.description.trim() && agent.capabilities.length > 0 && agent.endpoint.trim()
  );

  // Domain ownership: read the domain's real DNS records back through
  // name.com's Core API and confirm our discovery TXT marker is present
  // with the value we expect. This is a genuine check against name.com —
  // not a guess — but it proves control of the domain's DNS via name.com,
  // not classic domain-validation cryptography.
  let domainOwnershipVerified = false;
  try {
    const records = await listDnsRecords(agent.rootDomain);
    const expectedHost = discoveryTxtHost(agent.publicationPoint);
    const expectedValue = buildDiscoveryTxtValue(agent);
    domainOwnershipVerified = records.some(
      (r) => r.type === "TXT" && (r.host === expectedHost || r.host === `${expectedHost}.`) && r.answer === expectedValue
    );
  } catch {
    domainOwnershipVerified = false;
  }

  // Gateway: LaunchName's own /api/gateway/[host] route is a deterministic
  // read of this same agent record — there's no network hop that could
  // fail independently of the record existing, so this is true once the
  // agent has been created, not a network probe.
  const gatewayConfigured = true;

  // Public reachability: a REAL request to the agent's own declared
  // endpoint. In name.com's sandbox this is expected to fail — sandbox
  // registration never touches real public DNS, so the domain name may
  // not resolve at all, or (subtly) it may already belong to someone
  // else entirely on the real internet who happens to answer HTTP
  // requests at that path. A bare 200 OK is NOT proof it's actually
  // this agent — we require the response to identify itself as this
  // agent's own manifest (domain field matching this host) before
  // calling it reachable, so an unrelated live website can't produce a
  // false "verified" result.
  let publiclyReachable = false;
  let reachabilityNote: string;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ENDPOINT_CHECK_TIMEOUT_MS);
    const res = await fetch(agent.endpoint, { method: "GET", signal: controller.signal }).finally(() => clearTimeout(timer));
    if (!res.ok) {
      reachabilityNote = `The agent's own endpoint responded with HTTP ${res.status}.`;
    } else {
      const body = await res.json().catch(() => null);
      const identifiesAsThisAgent = body && typeof body === "object" && (body.domain === agent.host || body.identity?.domain === agent.host);
      if (identifiesAsThisAgent) {
        publiclyReachable = true;
        reachabilityNote = "The agent's own endpoint responded and identified itself as this agent.";
      } else {
        reachabilityNote =
          "The endpoint responded, but didn't identify itself as this agent. It may be an unrelated site occupying this domain name on the real internet (expected for a sandbox-registered domain, which never claims real public DNS).";
      }
    }
  } catch {
    reachabilityNote =
      "Not publicly reachable yet, expected for a sandbox domain, since its DNS doesn't propagate publicly. Talk to this agent through LaunchName's gateway instead, or re-check once this domain is live in production.";
  }

  return {
    domainOwnershipVerified,
    identityDeclared,
    gatewayConfigured,
    publiclyReachable,
    lastCheckedAt: new Date().toISOString(),
    reachabilityNote,
  };
}
