import "server-only";
import { listAgentsForRootDomain, listAllAgents } from "./store";
import type { AgentDirectoryFilters, AgentDiscoveryRecord, DomainAgentIndex } from "./types";

/**
 * AgentResolver — domain-scoped discovery in the spirit of DNS-AID/ANS
 * and index-based proposals like Project NANDA and AGNTCY: given a root
 * domain, resolve every agent LaunchName knows about that's published
 * under it (the apex itself, plus any subdomains). This only searches
 * LaunchName's own registry, not the public internet — see the
 * empty-state copy in features/agents/AgentDirectory.tsx for why that
 * distinction matters.
 */
export function resolveDomain(rootDomain: string): DomainAgentIndex {
  const agents = listAgentsForRootDomain(rootDomain.toLowerCase());
  return {
    rootDomain,
    agentCount: agents.length,
    publicationPoints: agents.map((a) => a.publicationPoint),
    agents,
  };
}

const CAPABILITY_SYNONYMS: Record<string, string[]> = {
  "travel-planning": ["travel", "trip", "vacation", "itinerary"],
  "flight-research": ["flight", "flights", "airfare", "airline"],
  "hotel-research": ["hotel", "stay", "accommodation", "lodging", "apartment", "housing"],
  "customer-support": ["support", "help", "ticket", "faq"],
  "code-review": ["code", "review", "pull request", "pr"],
  "security-analysis": ["security", "vulnerability", "audit"],
  "pricing": ["price", "pricing", "quote", "cost"],
  "lead-qualification": ["lead", "sales", "qualify"],
};

function textMatchesCapability(query: string, capabilityId: string, capabilityLabel: string): boolean {
  const q = query.toLowerCase();
  if (capabilityId.includes(q) || capabilityLabel.toLowerCase().includes(q)) return true;
  const synonyms = CAPABILITY_SYNONYMS[capabilityId] ?? [];
  return synonyms.some((s) => q.includes(s) || s.includes(q));
}

/**
 * AgentRegistry search — capability/category/protocol filtering plus a
 * lightweight intent search so users can type "what can help me book a
 * hotel" instead of needing to know an agent's name.
 */
export function searchAgents(filters: AgentDirectoryFilters): AgentDiscoveryRecord[] {
  let results = listAllAgents().filter((a) => a.status !== "draft");

  if (filters.category) results = results.filter((a) => a.category === filters.category);
  if (filters.protocol) results = results.filter((a) => a.protocols.includes(filters.protocol!));
  if (filters.capability) results = results.filter((a) => a.capabilities.some((c) => c.id === filters.capability));

  if (filters.query && filters.query.trim()) {
    const q = filters.query.trim().toLowerCase();
    results = results
      .map((a) => {
        let score = 0;
        if (a.name.toLowerCase().includes(q)) score += 5;
        if (a.description.toLowerCase().includes(q)) score += 2;
        if (a.capabilities.some((c) => textMatchesCapability(q, c.id, c.label))) score += 4;
        return { a, score };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.a);
  }

  return results;
}
