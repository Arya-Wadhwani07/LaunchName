import "server-only";
import { coreFetch } from "./client";
import type {
  AccountBalance,
  Contacts,
  CreateDomainResponse,
  Domain,
  ListDomainsResponse,
  PricingResult,
  PurchaseType,
  SearchResult,
  TldRequirements,
} from "./types";

/** POST /core/v1/domains:checkAvailability — up to 50 domains per call. */
export async function checkAvailability(
  domainNames: string[],
  purchaseType: PurchaseType = "registration"
): Promise<SearchResult[]> {
  if (domainNames.length === 0) return [];
  const batches: string[][] = [];
  for (let i = 0; i < domainNames.length; i += 50) batches.push(domainNames.slice(i, i + 50));

  const results = await Promise.all(
    batches.map((batch) =>
      coreFetch<{ results: SearchResult[] }>("/core/v1/domains:checkAvailability", {
        method: "POST",
        body: { domainNames: batch, purchaseType },
      })
    )
  );
  return results.flatMap((r) => r.results);
}

/** POST /core/v1/domains:search — keyword-based suggestions with pricing. */
export async function searchDomains(
  keyword: string,
  tldFilter?: string[],
  purchaseType: PurchaseType = "registration"
): Promise<SearchResult[]> {
  const data = await coreFetch<{ results: SearchResult[] }>("/core/v1/domains:search", {
    method: "POST",
    body: { keyword, tldFilter, purchaseType },
  });
  return data.results;
}

/**
 * GET /core/v1/domaininfo/requirements/{tld} — per-TLD rules, notably
 * `allowedRegistrationYears`. Some TLDs don't allow 1-year terms (.ai
 * requires 2+), others cap the maximum (.co tops out at 5) — this has to
 * be looked up per TLD rather than assumed, since it varies and can change.
 */
export async function getTldRequirements(tld: string): Promise<TldRequirements> {
  const data = await coreFetch<{ tldInfo: { tld: string; allowedRegistrationYears?: number[]; supportsPrivacy?: boolean; supportsPremium?: boolean } }>(
    `/core/v1/domaininfo/requirements/${encodeURIComponent(tld)}`
  );
  return {
    tld: data.tldInfo.tld,
    allowedRegistrationYears: data.tldInfo.allowedRegistrationYears?.length ? data.tldInfo.allowedRegistrationYears : [1, 2, 3],
    supportsPrivacy: data.tldInfo.supportsPrivacy ?? true,
    supportsPremium: data.tldInfo.supportsPremium ?? false,
  };
}

/** GET /core/v1/domains/{domainName}:getPricing */
export async function getPricingForDomain(domainName: string, years?: number): Promise<PricingResult> {
  return coreFetch<PricingResult>(`/core/v1/domains/${encodeURIComponent(domainName)}:getPricing`, {
    query: years ? { years } : undefined,
  });
}

export interface RegisterDomainInput {
  domainName: string;
  years: number;
  privacyEnabled: boolean;
  purchasePrice?: number;
  purchaseType?: PurchaseType;
  contacts?: Contacts;
  idempotencyKey: string;
}

/**
 * POST /core/v1/domains — the actual purchase call. Callers are expected
 * to have re-run checkAvailability immediately before this (availability
 * can change between search and purchase); this function does not do
 * that re-check itself so it stays a thin, honest wrapper around one
 * Core API call.
 */
export async function registerDomain(input: RegisterDomainInput): Promise<CreateDomainResponse> {
  return coreFetch<CreateDomainResponse>("/core/v1/domains", {
    method: "POST",
    idempotencyKey: input.idempotencyKey,
    body: {
      domain: {
        domainName: input.domainName,
        autorenewEnabled: true,
        locked: true,
        privacyEnabled: input.privacyEnabled,
        contacts: input.contacts,
      },
      years: input.years,
      purchasePrice: input.purchasePrice,
      purchaseType: input.purchaseType ?? "registration",
    },
  });
}

/** GET /core/v1/domains/{domainName} */
export async function getDomain(domainName: string): Promise<Domain> {
  return coreFetch<Domain>(`/core/v1/domains/${encodeURIComponent(domainName)}`);
}

/** GET /core/v1/domains — domains actually registered on this account. */
export async function listDomains(): Promise<Domain[]> {
  const data = await coreFetch<ListDomainsResponse>("/core/v1/domains", {
    query: { perPage: 250 },
  });
  return data.domains ?? [];
}

/** POST /core/v1/domains/{domainName}:setNameservers */
export async function setNameservers(domainName: string, nameservers: string[]): Promise<Domain> {
  return coreFetch<Domain>(`/core/v1/domains/${encodeURIComponent(domainName)}:setNameservers`, {
    method: "POST",
    body: { nameservers },
  });
}

/** GET /core/v1/accountinfo/balance */
export async function getAccountBalance(): Promise<AccountBalance> {
  return coreFetch<AccountBalance>("/core/v1/accountinfo/balance");
}
