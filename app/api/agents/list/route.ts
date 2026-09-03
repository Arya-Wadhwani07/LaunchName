import { NextResponse } from "next/server";
import { listAllAgents } from "@/lib/agents/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ agents: listAllAgents() });
}
