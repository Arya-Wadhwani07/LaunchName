import { NextResponse } from "next/server";
import { createDnsRecord } from "@/lib/namecom";
import { markCapability } from "@/lib/apiStatus";
import { getAgent, updateAgent } from "@/lib/agents/store";
import { buildDiscoveryTxtValue, discoveryTxtHost } from "@/lib/agents";
import { appendActivity } from "@/lib/store";
import { errorResponse, badRequest } from "@/lib/http";

const FALLBACK_HOST_IP = "76.76.21.21";

/**
 * Publishes an agent's discovery metadata as a real DNS TXT record via
 * name.com's Core API — labeled everywhere in the UI as "agent discovery
 * metadata," never as an official DNS-AID/ANS record (those specify SVCB +
 * DANE TLSA, which name.com doesn't expose). If the agent lives on a
 * subdomain (not the apex), also creates the A record that makes that
 * subdomain itself real DNS, not just a claim in our own database.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const host = typeof body.host === "string" ? body.host.trim().toLowerCase() : "";
  if (!host) return badRequest("Missing 'host'.");

  const agent = getAgent(host);
  if (!agent) return badRequest("No agent found for that host. Create it first.");

  const hostIp = process.env.LANDING_PAGE_HOST_IP || FALLBACK_HOST_IP;
  const txtHost = discoveryTxtHost(agent.publicationPoint);
  const txtValue = buildDiscoveryTxtValue(agent);

  try {
    const created = [];
    if (agent.publicationPoint !== "@") {
      created.push(await createDnsRecord(agent.rootDomain, { host: agent.publicationPoint, type: "A", answer: hostIp, ttl: 300 }));
    }
    created.push(await createDnsRecord(agent.rootDomain, { host: txtHost, type: "TXT", answer: txtValue, ttl: 300 }));
    markCapability("dns");

    const updated = updateAgent(host, { status: "published" });
    appendActivity(agent.rootDomain, `Agent discovery metadata published for ${agent.name} (${host})`);

    return NextResponse.json({ agent: updated, records: created });
  } catch (err) {
    appendActivity(agent.rootDomain, `Publishing discovery metadata for ${agent.name} needs attention`);
    return errorResponse(err);
  }
}
