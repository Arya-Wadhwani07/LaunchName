import "server-only";
import { coreFetch } from "./client";
import type { DnsRecord, DnsRecordInput, ListDnsRecordsResponse } from "./types";

/** GET /core/v1/domains/{domainName}/records */
export async function listDnsRecords(domainName: string): Promise<DnsRecord[]> {
  const data = await coreFetch<ListDnsRecordsResponse>(
    `/core/v1/domains/${encodeURIComponent(domainName)}/records`,
    { query: { perPage: 500 } }
  );
  return data.records ?? [];
}

/** POST /core/v1/domains/{domainName}/records */
export async function createDnsRecord(domainName: string, input: DnsRecordInput): Promise<DnsRecord> {
  return coreFetch<DnsRecord>(`/core/v1/domains/${encodeURIComponent(domainName)}/records`, {
    method: "POST",
    body: { type: input.type, host: input.host, answer: input.answer, ttl: input.ttl ?? 300, priority: input.priority },
  });
}

/** PUT /core/v1/domains/{domainName}/records/{id} */
export async function updateDnsRecord(
  domainName: string,
  id: number,
  input: DnsRecordInput
): Promise<DnsRecord> {
  return coreFetch<DnsRecord>(`/core/v1/domains/${encodeURIComponent(domainName)}/records/${id}`, {
    method: "PUT",
    body: { type: input.type, host: input.host, answer: input.answer, ttl: input.ttl ?? 300, priority: input.priority },
  });
}

/** DELETE /core/v1/domains/{domainName}/records/{id} */
export async function deleteDnsRecord(domainName: string, id: number): Promise<void> {
  await coreFetch<void>(`/core/v1/domains/${encodeURIComponent(domainName)}/records/${id}`, {
    method: "DELETE",
  });
}
