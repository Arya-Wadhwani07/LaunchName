import "server-only";
import { randomUUID } from "crypto";
import { hasCredentials, currentEnvironment, currentBaseUrl } from "./client";
import * as live from "./domains";
import * as liveDns from "./dns";
import * as mock from "./mock";
import { NameComError } from "./errors";
import type {
  Contacts,
  Domain,
  DnsRecord,
  DnsRecordInput,
  NameComMode,
  PricingResult,
  SearchResult,
  TldRequirements,
} from "./types";

/**
 * The one decision point for "real name.com vs mock provider." Everything
 * else in this app calls the functions exported below and never imports
 * ./domains, ./dns, or ./mock directly — so there is exactly one place
 * that knows whether credentials are configured.
 */
export function getMode(): NameComMode {
  return hasCredentials() ? "live" : "mock";
}

export function providerInfo() {
  return {
    mode: getMode(),
    environment: currentEnvironment(),
    baseUrl: currentBaseUrl(),
  };
}

const provider = {
  checkAvailability: (...args: Parameters<typeof live.checkAvailability>) =>
    getMode() === "live" ? live.checkAvailability(...args) : mock.checkAvailability(...args),
  searchDomains: (...args: Parameters<typeof live.searchDomains>) =>
    getMode() === "live" ? live.searchDomains(...args) : mock.searchDomains(...args),
  getPricingForDomain: (...args: Parameters<typeof live.getPricingForDomain>) =>
    getMode() === "live" ? live.getPricingForDomain(...args) : mock.getPricingForDomain(...args),
  getTldRequirements: (...args: Parameters<typeof live.getTldRequirements>) =>
    getMode() === "live" ? live.getTldRequirements(...args) : mock.getTldRequirements(...args),
  getDomain: (...args: Parameters<typeof live.getDomain>) =>
    getMode() === "live" ? live.getDomain(...args) : mock.getDomain(...args),
  listDomains: (...args: Parameters<typeof live.listDomains>) =>
    getMode() === "live" ? live.listDomains(...args) : mock.listDomains(...args),
  setNameservers: (...args: Parameters<typeof live.setNameservers>) =>
    getMode() === "live" ? live.setNameservers(...args) : mock.setNameservers(...args),
  getAccountBalance: (...args: Parameters<typeof live.getAccountBalance>) =>
    getMode() === "live" ? live.getAccountBalance(...args) : mock.getAccountBalance(...args),
  listDnsRecords: (...args: Parameters<typeof liveDns.listDnsRecords>) =>
    getMode() === "live" ? liveDns.listDnsRecords(...args) : mock.listDnsRecords(...args),
  createDnsRecord: (...args: Parameters<typeof liveDns.createDnsRecord>) =>
    getMode() === "live" ? liveDns.createDnsRecord(...args) : mock.createDnsRecord(...args),
  updateDnsRecord: (...args: Parameters<typeof liveDns.updateDnsRecord>) =>
    getMode() === "live" ? liveDns.updateDnsRecord(...args) : mock.updateDnsRecord(...args),
  deleteDnsRecord: (...args: Parameters<typeof liveDns.deleteDnsRecord>) =>
    getMode() === "live" ? liveDns.deleteDnsRecord(...args) : mock.deleteDnsRecord(...args),
};

export const {
  checkAvailability,
  searchDomains,
  getPricingForDomain,
  getTldRequirements,
  getDomain,
  listDomains,
  setNameservers,
  getAccountBalance,
  listDnsRecords,
  createDnsRecord,
  updateDnsRecord,
  deleteDnsRecord,
} = provider;

export async function registerDomain(input: {
  domainName: string;
  years: number;
  privacyEnabled: boolean;
  purchasePrice?: number;
  contacts?: Contacts;
}) {
  const idempotencyKey = randomUUID();
  if (getMode() === "live") {
    return live.registerDomain({ ...input, idempotencyKey, purchaseType: "registration" });
  }
  return mock.registerDomain(input);
}

/** The curated TLD set the domain-discovery screen searches by default. */
export const DEFAULT_CANDIDATE_TLDS = ["com", "ai", "io", "co", "dev", "app"];

export interface DomainCandidateOptions {
  tlds?: string[];
  includeGetPrefix?: boolean;
}

/** Turns a brand name into the exact domain strings we'll check availability for. */
export function buildCandidateDomains(brandName: string, opts: DomainCandidateOptions = {}): string[] {
  const slug = brandName
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
  if (!slug) return [];
  const tlds = opts.tlds ?? DEFAULT_CANDIDATE_TLDS;
  const names = tlds.map((tld) => `${slug}.${tld}`);
  if (opts.includeGetPrefix) names.push(`get${slug}.com`);
  return Array.from(new Set(names));
}

export type DomainCategory = "popular" | "ai" | "startup" | "developer" | "affordable";

const CATEGORY_TLDS: Record<DomainCategory, string[]> = {
  popular: ["com", "co"],
  ai: ["ai", "dev"],
  startup: ["io", "co", "app"],
  developer: ["dev", "io", "app"],
  affordable: [],
};

export function categoriesForResult(r: SearchResult, cheapThreshold = 20): DomainCategory[] {
  const cats: DomainCategory[] = [];
  for (const [cat, tlds] of Object.entries(CATEGORY_TLDS) as [DomainCategory, string[]][]) {
    if (tlds.includes(r.tld)) cats.push(cat);
  }
  if ((r.purchasePrice ?? Infinity) <= cheapThreshold && !r.premium) cats.push("affordable");
  return cats;
}

/**
 * Scores purchasable results to surface a single "Best Pick." Pure
 * application logic layered on top of real name.com availability/pricing
 * data — never invents availability or price.
 */
export function pickBestDomain(results: SearchResult[]): SearchResult | undefined {
  const TLD_WEIGHT: Record<string, number> = { com: 40, ai: 34, io: 30, dev: 26, app: 24, co: 20 };
  const purchasable = results.filter((r) => r.purchasable);
  if (purchasable.length === 0) return undefined;

  let best = purchasable[0];
  let bestScore = -Infinity;
  for (const r of purchasable) {
    let score = TLD_WEIGHT[r.tld] ?? 10;
    score -= r.sld.length * 1.5;
    if (r.premium) score -= 18;
    const price = r.purchasePrice ?? 15;
    score -= Math.min(price, 120) / 8;
    if (score > bestScore) {
      bestScore = score;
      best = r;
    }
  }
  return best;
}

export interface AvailabilityWithRetry {
  results: SearchResult[];
  errors: { domainName: string; message: string }[];
}

/**
 * checkAvailability with per-domain isolation: if the batch call itself
 * fails (auth, network, rate limit), every candidate becomes an ERROR
 * result instead of the whole screen failing — this is what lets the
 * domain grid show ERROR badges next to AVAILABLE/TAKEN/PREMIUM ones.
 */
export async function safeCheckAvailability(domainNames: string[]): Promise<AvailabilityWithRetry> {
  try {
    const results = await checkAvailability(domainNames);
    return { results, errors: [] };
  } catch (err) {
    const message = err instanceof NameComError ? err.friendlyMessage : "We couldn't reach the domain provider.";
    return {
      results: [],
      errors: domainNames.map((domainName) => ({ domainName, message })),
    };
  }
}

export type { Domain, DnsRecord, DnsRecordInput, PricingResult, SearchResult, Contacts, TldRequirements };
export { NameComError } from "./errors";
