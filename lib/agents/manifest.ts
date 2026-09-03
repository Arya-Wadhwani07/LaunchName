import type { AgentDiscoveryRecord, AgentManifest } from "./types";

/** Builds the JSON manifest shown in the UI and served at the agent's gateway path. */
export function buildManifest(agent: AgentDiscoveryRecord): AgentManifest {
  return {
    name: agent.name,
    domain: agent.host,
    description: agent.description,
    protocols: agent.protocols,
    capabilities: agent.capabilities.map((c) => c.id),
    endpoint: agent.endpoint,
    identity: { domain: agent.host },
  };
}

/**
 * The value written into the DNS TXT discovery marker. Deliberately
 * compact (TXT values are commonly kept well under 255 bytes, and DNS-AID's
 * own feasibility analysis targets ~940 bytes total at the 90th percentile
 * to stay inside a single unfragmented UDP response) and versioned so a
 * future real record type can be introduced alongside it without breaking
 * anything already published.
 *
 * This is LaunchName's own discovery-pointer format — NOT an official
 * DNS-AID/ANS record (those specify SVCB + DANE TLSA, which name.com's
 * Core API doesn't expose), and not a name.com feature. It exists so
 * verification.ts can prove (by reading it back through name.com's DNS
 * API) that whoever controls this domain's DNS also created this agent.
 */
export function buildDiscoveryTxtValue(agent: AgentDiscoveryRecord): string {
  return `launchname-agent=v1;id=${agent.id.slice(0, 12)};gw=${agent.gatewayPath}`;
}

export const DISCOVERY_TXT_HOST_PREFIX = "_agent-discovery";
