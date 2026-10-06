import { describe, expect, it } from "vitest";
import { validateDnsRecord } from "@/lib/validation";

const base = { host: "@", ttl: 300 };

describe("validateDnsRecord", () => {
  it("accepts a valid A record", () => {
    expect(validateDnsRecord({ ...base, type: "A", answer: "192.0.2.10" }).valid).toBe(true);
  });

  it("rejects an invalid IPv4 address", () => {
    const r = validateDnsRecord({ ...base, type: "A", answer: "999.1.1.1" });
    expect(r.valid).toBe(false);
    expect(r.errors[0]).toMatch(/IPv4/);
  });

  it("rejects a CNAME at the root domain", () => {
    const r = validateDnsRecord({ ...base, type: "CNAME", answer: "example.com." });
    expect(r.valid).toBe(false);
    expect(r.errors.join(" ")).toMatch(/root domain/);
  });

  it("accepts a CNAME on a subdomain", () => {
    expect(validateDnsRecord({ type: "CNAME", host: "www", ttl: 300, answer: "example.com." }).valid).toBe(true);
  });

  it("requires a priority for MX records", () => {
    expect(validateDnsRecord({ ...base, type: "MX", answer: "mail.example.com" }).valid).toBe(false);
    expect(validateDnsRecord({ ...base, type: "MX", answer: "mail.example.com", priority: 10 }).valid).toBe(true);
  });

  it("enforces name.com's TTL bounds", () => {
    expect(validateDnsRecord({ ...base, type: "TXT", answer: "x", ttl: 60 }).valid).toBe(false);
    expect(validateDnsRecord({ ...base, type: "TXT", answer: "x", ttl: 90000 }).valid).toBe(false);
  });

  it("requires SRV values to be weight, port, target", () => {
    expect(validateDnsRecord({ ...base, type: "SRV", answer: "10 5060", priority: 1 }).valid).toBe(false);
    expect(validateDnsRecord({ ...base, type: "SRV", answer: "10 5060 sip.example.com", priority: 1 }).valid).toBe(true);
  });

  it("accepts the agent discovery TXT record host", () => {
    expect(validateDnsRecord({ type: "TXT", host: "_agent-discovery", ttl: 300, answer: "launchname-agent=v1;id=abc" }).valid).toBe(true);
  });

  it("accepts underscore service hosts used by email security records", () => {
    expect(validateDnsRecord({ type: "TXT", host: "_dmarc", ttl: 300, answer: "v=DMARC1; p=none" }).valid).toBe(true);
    expect(validateDnsRecord({ type: "TXT", host: "selector1._domainkey", ttl: 300, answer: "v=DKIM1; k=rsa" }).valid).toBe(true);
    expect(validateDnsRecord({ type: "TXT", host: "_agent-discovery.travel", ttl: 300, answer: "x" }).valid).toBe(true);
  });

  it("still rejects malformed hosts", () => {
    expect(validateDnsRecord({ type: "TXT", host: "bad host", ttl: 300, answer: "x" }).valid).toBe(false);
    expect(validateDnsRecord({ type: "TXT", host: "-leading", ttl: 300, answer: "x" }).valid).toBe(false);
    expect(validateDnsRecord({ type: "TXT", host: "a..b", ttl: 300, answer: "x" }).valid).toBe(false);
  });

  it("accepts a wildcard host", () => {
    expect(validateDnsRecord({ type: "A", host: "*", ttl: 300, answer: "192.0.2.1" }).valid).toBe(true);
  });

  it("requires a record type", () => {
    expect(validateDnsRecord({ ...base, type: "", answer: "x" }).valid).toBe(false);
  });
});
