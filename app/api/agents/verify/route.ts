import { NextResponse } from "next/server";
import { getAgent, updateVerification, updateAgent } from "@/lib/agents/store";
import { verifyAgent } from "@/lib/agents/verification";
import { markCapability } from "@/lib/apiStatus";
import { appendActivity } from "@/lib/store";
import { errorResponse, badRequest } from "@/lib/http";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const host = typeof body.host === "string" ? body.host.trim().toLowerCase() : "";
  if (!host) return badRequest("Missing 'host'.");

  const agent = getAgent(host);
  if (!agent) return badRequest("No agent found for that host.");

  try {
    const verification = await verifyAgent(agent);
    markCapability("dns");
    let updated = updateVerification(host, verification);
    if (verification.domainOwnershipVerified && verification.identityDeclared) {
      updated = updateAgent(host, { status: "verified" });
    }
    appendActivity(
      agent.rootDomain,
      verification.domainOwnershipVerified
        ? `Agent ${agent.name} verified: domain ownership confirmed via name.com DNS`
        : `Agent ${agent.name} verification checked, domain ownership not yet confirmed`
    );
    return NextResponse.json({ agent: updated });
  } catch (err) {
    return errorResponse(err);
  }
}
