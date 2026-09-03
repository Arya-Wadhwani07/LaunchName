import { NextResponse } from "next/server";
import { getAgent } from "@/lib/agents/store";
import { buildManifest } from "@/lib/agents/manifest";
import { DemoAgentConnector } from "@/lib/agents/connector";
import { badRequest } from "@/lib/http";

export const dynamic = "force-dynamic";

/**
 * LaunchName's own always-on stand-in for an agent's real endpoint. A
 * domain registered through name.com's sandbox can't resolve publicly, so
 * this is what actually answers when nothing else can — GET returns the
 * agent's manifest, POST simulates a message via the demo connector. It
 * is explicitly a LaunchName-hosted gateway, not the agent's own
 * infrastructure; the UI never calls this a "live agent."
 */
export async function GET(_req: Request, { params }: { params: { domain: string } }) {
  const host = decodeURIComponent(params.domain).toLowerCase();
  const agent = getAgent(host);
  if (!agent) return NextResponse.json({ error: { code: "NOT_FOUND", message: "No agent published at this host." } }, { status: 404 });
  return NextResponse.json(buildManifest(agent));
}

export async function POST(req: Request, { params }: { params: { domain: string } }) {
  const host = decodeURIComponent(params.domain).toLowerCase();
  const agent = getAgent(host);
  if (!agent) return NextResponse.json({ error: { code: "NOT_FOUND", message: "No agent published at this host." } }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) return badRequest("Missing 'message'.");

  const connector = new DemoAgentConnector();
  const response = await connector.sendMessage(agent, message);
  return NextResponse.json({ response, connector: "demo" });
}
