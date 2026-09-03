import "server-only";
import { randomUUID } from "crypto";
import type { AgentDiscoveryRecord, AgentVerificationState } from "./types";

/**
 * In-process agent registry — same pattern as lib/store.ts (launches):
 * name.com remains the source of truth for the domain and its DNS
 * records; this only remembers the agent metadata layered on top,
 * keyed by host (a root domain or one of its subdomains).
 */

interface AgentStore {
  byHost: Map<string, AgentDiscoveryRecord>;
  hostsByRootDomain: Map<string, Set<string>>;
}

const g = globalThis as unknown as { __launchnameAgentStore?: AgentStore };
if (!g.__launchnameAgentStore) {
  g.__launchnameAgentStore = { byHost: new Map(), hostsByRootDomain: new Map() };
}
const store = g.__launchnameAgentStore;

const DEFAULT_VERIFICATION: AgentVerificationState = {
  domainOwnershipVerified: false,
  identityDeclared: false,
  gatewayConfigured: false,
  publiclyReachable: false,
};

export function createAgent(input: {
  host: string;
  rootDomain: string;
  publicationPoint: string;
  name: string;
  description: string;
  capabilities: AgentDiscoveryRecord["capabilities"];
  category: AgentDiscoveryRecord["category"];
  protocols: AgentDiscoveryRecord["protocols"];
  endpoint: string;
}): AgentDiscoveryRecord {
  const record: AgentDiscoveryRecord = {
    id: randomUUID(),
    host: input.host,
    rootDomain: input.rootDomain,
    publicationPoint: input.publicationPoint,
    name: input.name,
    description: input.description,
    capabilities: input.capabilities,
    category: input.category,
    protocols: input.protocols,
    endpoint: input.endpoint,
    gatewayPath: `/api/gateway/${input.host}`,
    verification: { ...DEFAULT_VERIFICATION },
    status: "draft",
    createdAt: new Date().toISOString(),
  };
  store.byHost.set(input.host, record);
  const set = store.hostsByRootDomain.get(input.rootDomain) ?? new Set();
  set.add(input.host);
  store.hostsByRootDomain.set(input.rootDomain, set);
  return record;
}

export function getAgent(host: string): AgentDiscoveryRecord | undefined {
  return store.byHost.get(host);
}

export function updateAgent(host: string, patch: Partial<AgentDiscoveryRecord>): AgentDiscoveryRecord | undefined {
  const existing = store.byHost.get(host);
  if (!existing) return undefined;
  const updated = { ...existing, ...patch };
  store.byHost.set(host, updated);
  return updated;
}

export function updateVerification(host: string, patch: Partial<AgentVerificationState>): AgentDiscoveryRecord | undefined {
  const existing = store.byHost.get(host);
  if (!existing) return undefined;
  const verification = { ...existing.verification, ...patch, lastCheckedAt: new Date().toISOString() };
  const updated = { ...existing, verification };
  store.byHost.set(host, updated);
  return updated;
}

export function listAgentsForRootDomain(rootDomain: string): AgentDiscoveryRecord[] {
  const hosts = store.hostsByRootDomain.get(rootDomain);
  if (!hosts) return [];
  return Array.from(hosts)
    .map((h) => store.byHost.get(h))
    .filter((a): a is AgentDiscoveryRecord => Boolean(a));
}

export function listAllAgents(): AgentDiscoveryRecord[] {
  return Array.from(store.byHost.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
