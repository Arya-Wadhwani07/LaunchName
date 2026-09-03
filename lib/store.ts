import "server-only";
import { randomUUID } from "crypto";

/**
 * In-process launch store. LaunchName doesn't need a database: the source
 * of truth for domains, pricing, and DNS is always name.com itself (see
 * lib/namecom). This store only remembers the product-specific metadata
 * name.com has no concept of — which idea/brand a domain came from, and
 * the activity log — keyed by domain name, held in a globalThis singleton
 * so it survives Next.js dev-server hot reloads within one process.
 */

export type LaunchStatus = "registering" | "domain_registered" | "dns_configured" | "live";

export interface ActivityEvent {
  id: string;
  timestamp: string;
  message: string;
}

export interface LaunchRecord {
  id: string;
  slug: string;
  domainName: string;
  idea: string;
  brandName: string;
  tagline: string;
  personality: string[];
  years: number;
  privacyEnabled: boolean;
  totalPaid?: number;
  status: LaunchStatus;
  registeredAt?: string;
  dnsConfiguredAt?: string;
  liveAt?: string;
  activity: ActivityEvent[];
}

interface Store {
  byDomain: Map<string, LaunchRecord>;
  bySlug: Map<string, string>;
}

const g = globalThis as unknown as { __launchnameStore?: Store };
if (!g.__launchnameStore) {
  g.__launchnameStore = { byDomain: new Map(), bySlug: new Map() };
}
const store = g.__launchnameStore;

function slugify(brandName: string): string {
  const base = brandName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  let slug = base || "launch";
  let n = 1;
  while (store.bySlug.has(slug) && store.bySlug.get(slug) !== slug) {
    slug = `${base}-${++n}`;
  }
  return slug;
}

export function createLaunch(input: {
  domainName: string;
  idea: string;
  brandName: string;
  tagline: string;
  personality: string[];
  years: number;
  privacyEnabled: boolean;
  totalPaid?: number;
}): LaunchRecord {
  const slug = slugify(input.brandName);
  const record: LaunchRecord = {
    id: randomUUID(),
    slug,
    ...input,
    status: "domain_registered",
    registeredAt: new Date().toISOString(),
    activity: [],
  };
  store.byDomain.set(input.domainName, record);
  store.bySlug.set(slug, input.domainName);
  return record;
}

export function getLaunch(domainName: string): LaunchRecord | undefined {
  return store.byDomain.get(domainName);
}

export function getLaunchBySlug(slug: string): LaunchRecord | undefined {
  const domainName = store.bySlug.get(slug);
  return domainName ? store.byDomain.get(domainName) : undefined;
}

export function listLaunches(): LaunchRecord[] {
  return Array.from(store.byDomain.values()).sort((a, b) => (b.registeredAt ?? "").localeCompare(a.registeredAt ?? ""));
}

export function updateLaunchStatus(domainName: string, status: LaunchStatus): LaunchRecord | undefined {
  const record = store.byDomain.get(domainName);
  if (!record) return undefined;
  record.status = status;
  if (status === "dns_configured") record.dnsConfiguredAt = new Date().toISOString();
  if (status === "live") record.liveAt = new Date().toISOString();
  return record;
}

export function appendActivity(domainName: string, message: string): ActivityEvent | undefined {
  const record = store.byDomain.get(domainName);
  if (!record) return undefined;
  const event: ActivityEvent = { id: randomUUID(), timestamp: new Date().toISOString(), message };
  record.activity.push(event);
  return event;
}
