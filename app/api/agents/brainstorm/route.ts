import { NextResponse } from "next/server";
import { generateAgentProfile, agentBrainstormMode } from "@/lib/agents/brainstorm";
import { badRequest } from "@/lib/http";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const idea = typeof body.idea === "string" ? body.idea.trim() : "";
  const agentName = typeof body.agentName === "string" ? body.agentName.trim() : "";
  if (!idea) return badRequest("Missing 'idea'.");
  if (!agentName) return badRequest("Missing 'agentName'.");

  const profile = await generateAgentProfile(idea, agentName);
  return NextResponse.json({ profile, mode: agentBrainstormMode() });
}
