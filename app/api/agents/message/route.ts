import { NextResponse } from "next/server";
import { getAgent } from "@/lib/agents/store";
import { buildDiscoverySteps, connectionEstablishedStep, requestStep, responseStep } from "@/lib/agents/handshake";
import { pickConnector } from "@/lib/agents/connector";
import { appendActivity } from "@/lib/store";
import { errorResponse, badRequest } from "@/lib/http";
import type { AgentMessageResult } from "@/lib/agents/types";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const host = typeof body.host === "string" ? body.host.trim().toLowerCase() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const fromAgentName = typeof body.fromAgentName === "string" && body.fromAgentName.trim() ? body.fromAgentName.trim() : "StudentPlanner";
  if (!host) return badRequest("Missing 'host'.");
  if (!message) return badRequest("Missing 'message'.");

  const agent = getAgent(host);
  if (!agent) return badRequest("No agent found for that host.");

  const connector = pickConnector(agent);
  const handshake = [...buildDiscoverySteps(agent, fromAgentName), connectionEstablishedStep(connector), requestStep(message)];

  try {
    const response = await connector.sendMessage(agent, message);
    handshake.push(responseStep(response));
    appendActivity(agent.rootDomain, `${fromAgentName} messaged ${agent.name} (${connector.kind === "live" ? "live" : "demo"})`);

    const result: AgentMessageResult = { connector: connector.kind, message, response, handshake };
    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}
