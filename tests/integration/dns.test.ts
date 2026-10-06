import { describe, expect, it } from "vitest";
import { POST as bootstrap } from "@/app/api/dns/bootstrap/route";
import { GET as listRecords, POST as createRecord } from "@/app/api/dns/records/route";
import { PUT as updateRecord, DELETE as deleteRecord } from "@/app/api/dns/records/[id]/route";
import { call, jsonRequest, registerFresh } from "./helpers";

async function records(domain: string) {
  const { body } = await call(listRecords(jsonRequest(`/api/dns/records?domain=${domain}`)));
  return body.records as any[];
}

describe("DNS bootstrap", () => {
  it("refuses to configure DNS for a domain that was never registered", async () => {
    const { status } = await call(bootstrap(jsonRequest("/api/dns/bootstrap", { domainName: "never-registered-xyz.com" })));
    expect(status).toBe(400);
  });

  it("creates the website A record, www alias and ownership TXT record", async () => {
    const domain = await registerFresh("lanternly");
    const { status } = await call(bootstrap(jsonRequest("/api/dns/bootstrap", { domainName: domain })));
    expect(status).toBe(200);
    const list = await records(domain);
    expect(list.map((r) => `${r.type} ${r.host}`).sort()).toEqual(["A @", "CNAME www", "TXT @"]);
    expect(list.find((r) => r.type === "TXT").answer).toMatch(/^launchname-verify-/);
  });
});

describe("DNS record management", () => {
  it("adds, edits and deletes a record", async () => {
    const domain = await registerFresh("pebblewick");

    const created = await call(createRecord(jsonRequest("/api/dns/records", { domain, type: "MX", host: "@", answer: "mail.example.com", ttl: 3600, priority: 10 })));
    expect(created.status).toBe(200);
    const id = created.body.record.id;

    const updated = await call(
      updateRecord(jsonRequest(`/api/dns/records/${id}`, { domain, type: "MX", host: "@", answer: "mail2.example.com", ttl: 3600, priority: 20 }, "PUT"), { params: { id: String(id) } })
    );
    expect(updated.status).toBe(200);
    expect((await records(domain)).find((r) => r.id === id).answer).toBe("mail2.example.com");

    const removed = await call(deleteRecord(jsonRequest(`/api/dns/records/${id}?domain=${domain}`, undefined, "DELETE"), { params: { id: String(id) } }));
    expect(removed.status).toBe(200);
    expect((await records(domain)).some((r) => r.id === id)).toBe(false);
  });

  it("rejects an invalid record before it reaches name.com", async () => {
    const domain = await registerFresh("cinderloom");
    const { status, body } = await call(createRecord(jsonRequest("/api/dns/records", { domain, type: "CNAME", host: "@", answer: "example.com.", ttl: 300 })));
    expect(status).toBe(400);
    expect(body.error.message).toMatch(/root domain/);
  });

  it("accepts underscore hosts like _dmarc (regression)", async () => {
    const domain = await registerFresh("velvetarc");
    const { status } = await call(createRecord(jsonRequest("/api/dns/records", { domain, type: "TXT", host: "_dmarc", answer: "v=DMARC1; p=none", ttl: 300 })));
    expect(status).toBe(200);
  });
});
