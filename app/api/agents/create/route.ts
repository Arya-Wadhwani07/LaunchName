import { NextResponse } from "next/server";
import { createAgent } from "@/lib/agents/store";
import { buildManifest } from "@/lib/agents/manifest";
import type { AgentCapability, AgentCategory, AgentProtocol } from "@/lib/agents/types";
import { appendActivity } from "@/lib/store";
import { badRequest } from "@/lib/http";

const VALID_PROTOCOLS: AgentProtocol[] = ["https", "streaming", "mcp"];
const VALID_CATEGORIES: AgentCategory[] = [
  "travel",
  "finance",
  "education",
  "developer-tools",
  "commerce",
  "productivity",
  "research",
  "customer-support",
  "other",
];

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const rootDomain = typeof body.rootDomain === "string" ? body.rootDomain.trim().toLowerCase() : "";
  const publicationPoint = typeof body.publicationPoint === "string" && body.publicationPoint.trim() ? body.publicationPoint.trim().toLowerCase() : "@";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const category: AgentCategory = VALID_CATEGORIES.includes(body.category) ? body.category : "other";
  const protocols: AgentProtocol[] = Array.isArray(body.protocols)
    ? body.protocols.filter((p: unknown): p is AgentProtocol => VALID_PROTOCOLS.includes(p as AgentProtocol))
    : ["https"];
  const capabilities: AgentCapability[] = Array.isArray(body.capabilities)
    ? body.capabilities
        .filter((c: unknown) => c && typeof c === "object" && typeof (c as any).id === "string" && typeof (c as any).label === "string")
        .slice(0, 8)
    : [];

  if (!rootDomain) return badRequest("Missing 'rootDomain'.");
  if (!name) return badRequest("Missing 'name'.");
  if (!description) return badRequest("Missing 'description'.");
  if (capabilities.length === 0) return badRequest("An agent needs at least one capability.");
  if (protocols.length === 0) return badRequest("An agent needs at least one protocol.");

  const host = publicationPoint === "@" ? rootDomain : `${publicationPoint}.${rootDomain}`;
  const endpoint = typeof body.endpoint === "string" && body.endpoint.trim() ? body.endpoint.trim() : `https://${host}/agent`;

  const agent = createAgent({ host, rootDomain, publicationPoint, name, description, capabilities, category, protocols, endpoint });
  appendActivity(rootDomain, `Agent identity created: ${name} (${host})`);

  return NextResponse.json({ agent, manifest: buildManifest(agent) });
}
