import { NextResponse } from "next/server";
import { getAgent } from "@/lib/agents/store";
import { buildDiscoverySteps, connectionEstablishedStep } from "@/lib/agents/handshake";
import { pickConnector } from "@/lib/agents/connector";
import { badRequest } from "@/lib/http";

/** Runs the discover → identify → capabilities → verify → resolve → connect portion of the handshake, ahead of any message. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const host = typeof body.host === "string" ? body.host.trim().toLowerCase() : "";
  const fromAgentName = typeof body.fromAgentName === "string" && body.fromAgentName.trim() ? body.fromAgentName.trim() : "StudentPlanner";
  if (!host) return badRequest("Missing 'host'.");

  const agent = getAgent(host);
  if (!agent) return badRequest("No agent found for that host.");

  const connector = pickConnector(agent);
  const steps = [...buildDiscoverySteps(agent, fromAgentName), connectionEstablishedStep(connector)];

  return NextResponse.json({ agent, connector: connector.kind, handshake: steps });
}
