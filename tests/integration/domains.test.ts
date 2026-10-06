import { describe, expect, it } from "vitest";
import { POST as searchDomains } from "@/app/api/domains/search/route";
import { POST as registerDomain } from "@/app/api/domains/register/route";
import { GET as tldRequirements } from "@/app/api/domains/tld-requirements/route";
import { GET as pricing } from "@/app/api/domains/pricing/route";
import { call, findAvailable, jsonRequest } from "./helpers";

describe("domain search", () => {
  it("returns scored, categorized results for a brand", async () => {
    const { status, body } = await call(searchDomains(jsonRequest("/api/domains/search", { brandName: "orbitly" })));
    expect(status).toBe(200);
    expect(body.results.length).toBeGreaterThan(0);
    const first = body.results[0];
    expect(first).toHaveProperty("humanScore");
    expect(first).toHaveProperty("agentScore");
    expect(Array.isArray(first.categories)).toBe(true);
  });

  it("includes both available and taken domains, so the availability toggle has something to filter", async () => {
    const { body } = await call(searchDomains(jsonRequest("/api/domains/search", { brandName: "orbitly", extraSlugs: ["orbitlyhq", "getorbitly"] })));
    const available = body.results.filter((r: any) => r.purchasable).length;
    const taken = body.results.filter((r: any) => !r.purchasable).length;
    expect(available).toBeGreaterThan(0);
    expect(taken).toBeGreaterThan(0);
  });

  it("rejects an empty brand name", async () => {
    const { status } = await call(searchDomains(jsonRequest("/api/domains/search", { brandName: "" })));
    expect(status).toBe(400);
  });
});

describe("registration period rules", () => {
  it("reports that .ai needs at least 2 years", async () => {
    const { body } = await call(tldRequirements(jsonRequest("/api/domains/tld-requirements?tld=ai")));
    expect(body.requirements.allowedRegistrationYears[0]).toBe(2);
    expect(body.requirements).toHaveProperty("supportsPrivacy");
  });

  it("refuses to price .ai for 1 year", async () => {
    const { status, body } = await call(pricing(jsonRequest("/api/domains/pricing?domain=orbitly.ai&years=1")));
    expect(status).toBe(400);
    expect(body.error.code).toBe("VALIDATION");
  });

  it("rejects registration periods outside 1-10 years", async () => {
    const { status } = await call(registerDomain(jsonRequest("/api/domains/register", { domainName: "orbitly.com", years: 11 })));
    expect(status).toBe(400);
  });
});

describe("registration", () => {
  it("registers an available domain and creates a launch record", async () => {
    const domainName = await findAvailable("quillfern", "com");
    const { status, body } = await call(registerDomain(jsonRequest("/api/domains/register", { domainName, years: 1, privacyEnabled: true, brandName: "Quillfern" })));
    expect(status).toBe(200);
    expect(body.launch.domainName).toBe(domainName);
    expect(body.launch.privacyEnabled).toBe(true);
  });

  it("returns a conflict when the same domain is registered twice", async () => {
    const domainName = await findAvailable("brambleo", "com");
    await registerDomain(jsonRequest("/api/domains/register", { domainName, years: 1 }));
    const { status, body } = await call(registerDomain(jsonRequest("/api/domains/register", { domainName, years: 1 })));
    expect(status).toBe(409);
    expect(body.error.code).toBe("CONFLICT");
  });
});
