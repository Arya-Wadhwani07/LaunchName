import { NextResponse } from "next/server";
import { searchAgents } from "@/lib/agents/discovery";
import type { AgentCategory, AgentProtocol } from "@/lib/agents/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") ?? undefined;
  const capability = searchParams.get("capability") ?? undefined;
  const category = (searchParams.get("category") as AgentCategory) || undefined;
  const protocol = (searchParams.get("protocol") as AgentProtocol) || undefined;

  const agents = searchAgents({ query, capability, category, protocol });
  return NextResponse.json({ agents });
}
