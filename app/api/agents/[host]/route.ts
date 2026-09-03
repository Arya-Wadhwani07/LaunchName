import { NextResponse } from "next/server";
import { getAgent } from "@/lib/agents/store";
import { buildManifest } from "@/lib/agents/manifest";

export const dynamic = "force-dynamic";

/** Full profile fetch by exact host — used by the agent profile page. */
export async function GET(_req: Request, { params }: { params: { host: string } }) {
  const host = decodeURIComponent(params.host).toLowerCase();
  const agent = getAgent(host);
  if (!agent) return NextResponse.json({ error: { code: "NOT_FOUND", message: "No agent found for that host." } }, { status: 404 });
  return NextResponse.json({ agent, manifest: buildManifest(agent) });
}
