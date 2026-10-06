import { describe, expect, it } from "vitest";
import { POST as createAgent } from "@/app/api/agents/create/route";
import { POST as publishAgent } from "@/app/api/agents/publish/route";
import { POST as verifyAgent } from "@/app/api/agents/verify/route";
import { GET as directory } from "@/app/api/agents/directory/route";
import { GET as listRecords } from "@/app/api/dns/records/route";
import { DELETE as deleteRecord } from "@/app/api/dns/records/[id]/route";
import { call, jsonRequest, registerFresh } from "./helpers";

// Port 9 (discard) on loopback refuses immediately, so the reachability
// probe fails fast instead of waiting out its timeout.
const UNREACHABLE = "http://127.0.0.1:9/agent";

function agentBody(rootDomain: string, extra: Record<string, unknown> = {}) {
  return {
    rootDomain,
    name: "Testbot",
    description: "Finds hotel deals for travelers.",
    category: "travel",
    protocols: ["https", "mcp"],
    capabilities: [{ id: "hotel-research", label: "Hotel Research" }],
    endpoint: UNREACHABLE,
    ...extra,
  };
}

async function recordsFor(domain: string) {
  return (await call(listRecords(jsonRequest(`/api/dns/records?domain=${domain}`)))).body.records as any[];
}

describe("agent identity", () => {
  it("requires at least one capability", async () => {
    const { status } = await call(createAgent(jsonRequest("/api/agents/create", agentBody("x.com", { capabilities: [] }))));
    expect(status).toBe(400);
  });

  it("creates, publishes to DNS and verifies domain ownership", async () => {
    const domain = await registerFresh("hearthwise");
    const created = await call(createAgent(jsonRequest("/api/agents/create", agentBody(domain))));
    expect(created.status).toBe(200);
    expect(created.body.manifest.domain).toBe(domain);

    const published = await call(publishAgent(jsonRequest("/api/agents/publish", { host: domain })));
    expect(published.status).toBe(200);
    const txt = (await recordsFor(domain)).find((r) => r.type === "TXT" && r.host === "_agent-discovery");
    expect(txt.answer).toMatch(/^launchname-agent=v1;id=/);

    const verified = await call(verifyAgent(jsonRequest("/api/agents/verify", { host: domain })));
    expect(verified.status).toBe(200);
    expect(verified.body.agent.verification.domainOwnershipVerified).toBe(true);
    expect(verified.body.agent.verification.identityDeclared).toBe(true);
    // Honest labeling: an unreachable endpoint must not be reported as live.
    expect(verified.body.agent.verification.publiclyReachable).toBe(false);
    expect(verified.body.agent.status).toBe("verified");
  });

  it("stops verifying ownership once the discovery record is removed from DNS", async () => {
    const domain = await registerFresh("tidewren");
    await createAgent(jsonRequest("/api/agents/create", agentBody(domain)));
    await publishAgent(jsonRequest("/api/agents/publish", { host: domain }));
    const txt = (await recordsFor(domain)).find((r) => r.host === "_agent-discovery");
    await deleteRecord(jsonRequest(`/api/dns/records/${txt.id}?domain=${domain}`, undefined, "DELETE"), { params: { id: String(txt.id) } });

    const { body } = await call(verifyAgent(jsonRequest("/api/agents/verify", { host: domain })));
    expect(body.agent.verification.domainOwnershipVerified).toBe(false);
  });

  it("gives a subdomain agent its own A record and nested discovery record", async () => {
    const domain = await registerFresh("mossgate");
    await createAgent(jsonRequest("/api/agents/create", agentBody(domain, { publicationPoint: "travel" })));
    await publishAgent(jsonRequest("/api/agents/publish", { host: `travel.${domain}` }));
    const list = await recordsFor(domain);
    expect(list.some((r) => r.type === "A" && r.host === "travel")).toBe(true);
    expect(list.some((r) => r.type === "TXT" && r.host === "_agent-discovery.travel")).toBe(true);
  });
});

describe("agent directory", () => {
  it("finds published agents by what they can do", async () => {
    const domain = await registerFresh("roamfinch");
    await createAgent(jsonRequest("/api/agents/create", agentBody(domain, { name: "Roamfinch" })));
    await publishAgent(jsonRequest("/api/agents/publish", { host: domain }));
    const { body } = await call(directory(jsonRequest("/api/agents/directory?query=book%20a%20hotel")));
    expect(body.agents.some((a: any) => a.host === domain)).toBe(true);
  });
});
