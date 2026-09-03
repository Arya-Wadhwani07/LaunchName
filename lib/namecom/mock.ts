/**
 * Mock name.com provider — used ONLY when NAMECOM_USERNAME / NAMECOM_API_TOKEN
 * are absent, so the UI stays fully explorable without credentials. It is
 * intentionally isolated in this one file and implements the exact same
 * function signatures as domains.ts + dns.ts, so lib/namecom/service.ts can
 * swap providers without any other file knowing which one is active.
 *
 * This is NEVER the production path — see service.ts for the selection
 * logic, and the "Powered by name.com" / debug drawer UI, which both
 * clearly label when mock mode is active.
 */
import { NameComError } from "./errors";
import type {
  AccountBalance,
  Contacts,
  CreateDomainResponse,
  Domain,
  DnsRecord,
  DnsRecordInput,
  PricingResult,
  PurchaseType,
  SearchResult,
  TldRequirements,
} from "./types";

interface MockState {
  registered: Map<string, Domain>;
  records: Map<string, DnsRecord[]>;
  nextRecordId: number;
}

const g = globalThis as unknown as { __launchnameMockState?: MockState };
if (!g.__launchnameMockState) {
  g.__launchnameMockState = { registered: new Map(), records: new Map(), nextRecordId: 1 };
}
const state = g.__launchnameMockState;

function hash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return h;
}

async function latency(min = 180, max = 560) {
  await new Promise((r) => setTimeout(r, min + Math.random() * (max - min)));
}

const PREMIUM_TLDS = new Set(["ai"]);
const BASE_PRICE: Record<string, number> = {
  com: 12.99,
  io: 44.99,
  ai: 89.0,
  co: 27.99,
  dev: 14.99,
  app: 16.99,
  net: 13.99,
  xyz: 3.99,
};

function priceFor(sld: string, tld: string) {
  const base = BASE_PRICE[tld] ?? 19.99;
  const premium = PREMIUM_TLDS.has(tld) && hash(sld) % 5 === 0;
  const purchasePrice = premium ? Math.round((base * (3 + (hash(sld) % 6))) * 100) / 100 : base;
  return { premium, purchasePrice, renewalPrice: premium ? purchasePrice : Math.round(base * 100) / 100 };
}

export async function checkAvailability(domainNames: string[], purchaseType: PurchaseType = "registration"): Promise<SearchResult[]> {
  await latency();
  return domainNames.map((domainName) => {
    const [sld, ...rest] = domainName.split(".");
    const tld = rest.join(".");
    if (state.registered.has(domainName)) {
      return { domainName, sld, tld, purchasable: false, reason: "Already registered." };
    }
    // Deterministic "taken" simulation so the demo feels alive but stable across reloads.
    const takenRoll = hash(domainName) % 10;
    if (takenRoll < 3) {
      return { domainName, sld, tld, purchasable: false, reason: "Already registered." };
    }
    const { premium, purchasePrice, renewalPrice } = priceFor(sld, tld);
    return { domainName, sld, tld, purchasable: true, premium, purchaseType, purchasePrice, renewalPrice };
  });
}

export async function searchDomains(keyword: string, tldFilter?: string[], purchaseType: PurchaseType = "registration"): Promise<SearchResult[]> {
  const tlds = tldFilter && tldFilter.length ? tldFilter : ["com", "ai", "io", "co", "dev", "app"];
  return checkAvailability(tlds.map((t) => `${keyword}.${t}`), purchaseType);
}

// Mirrors real registry constraints observed against name.com's sandbox,
// so mock mode surfaces the same validation behavior as the live API
// instead of silently accepting anything.
const TLD_ALLOWED_YEARS: Record<string, number[]> = {
  ai: [2, 3, 4, 5, 6, 7, 8, 9, 10],
  co: [1, 2, 3, 4, 5],
};
const DEFAULT_ALLOWED_YEARS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export async function getTldRequirements(tld: string): Promise<TldRequirements> {
  await latency(60, 150);
  return {
    tld,
    allowedRegistrationYears: TLD_ALLOWED_YEARS[tld] ?? DEFAULT_ALLOWED_YEARS,
    supportsPrivacy: true,
    supportsPremium: PREMIUM_TLDS.has(tld),
  };
}

export async function getPricingForDomain(domainName: string, years?: number): Promise<PricingResult> {
  await latency(80, 200);
  const [sld, ...rest] = domainName.split(".");
  const tld = rest.join(".");
  const allowed = TLD_ALLOWED_YEARS[tld] ?? DEFAULT_ALLOWED_YEARS;
  if (years !== undefined && !allowed.includes(years)) {
    throw new NameComError({ code: "VALIDATION", rawMessage: "Invalid value for years for this domain" });
  }
  const { premium, purchasePrice, renewalPrice } = priceFor(sld, tld);
  const multiplier = years ?? 1;
  return {
    premium,
    purchasePrice: premium ? purchasePrice : Math.round(purchasePrice * multiplier * 100) / 100,
    renewalPrice,
    transferPrice: renewalPrice,
  };
}

export interface MockRegisterInput {
  domainName: string;
  years: number;
  privacyEnabled: boolean;
  purchasePrice?: number;
  contacts?: Contacts;
}

export async function registerDomain(input: MockRegisterInput): Promise<CreateDomainResponse> {
  await latency(400, 900);
  if (state.registered.has(input.domainName)) {
    throw new NameComError({
      code: "CONFLICT",
      rawMessage: "This domain was just registered by someone else. Let's find another.",
    });
  }
  const tld = input.domainName.split(".").slice(1).join(".");
  const allowedYears = TLD_ALLOWED_YEARS[tld] ?? DEFAULT_ALLOWED_YEARS;
  if (!allowedYears.includes(input.years)) {
    throw new NameComError({ code: "VALIDATION", rawMessage: "Invalid years" });
  }
  const now = new Date();
  const expire = new Date(now);
  expire.setFullYear(expire.getFullYear() + input.years);
  const domain: Domain = {
    domainName: input.domainName,
    createDate: now.toISOString(),
    expireDate: expire.toISOString(),
    autorenewEnabled: true,
    locked: true,
    privacyEnabled: input.privacyEnabled,
    contacts: input.contacts,
    nameservers: ["ns1.name.com", "ns2.name.com"],
  };
  state.registered.set(input.domainName, domain);
  state.records.set(input.domainName, []);
  const [sld, ...rest] = input.domainName.split(".");
  const price = input.purchasePrice ?? priceFor(sld, rest.join(".")).purchasePrice;
  return {
    domain,
    order: 1000 + state.registered.size,
    totalPaid: price,
  };
}

export async function getDomain(domainName: string): Promise<Domain> {
  await latency(80, 200);
  const d = state.registered.get(domainName);
  if (!d) throw new NameComError({ code: "NOT_FOUND", rawMessage: "That domain doesn't exist." });
  return d;
}

export async function listDomains(): Promise<Domain[]> {
  await latency(80, 220);
  return Array.from(state.registered.values());
}

export async function setNameservers(domainName: string, nameservers: string[]): Promise<Domain> {
  await latency();
  const d = state.registered.get(domainName);
  if (!d) throw new NameComError({ code: "NOT_FOUND", rawMessage: "That domain doesn't exist." });
  d.nameservers = nameservers;
  return d;
}

export async function getAccountBalance(): Promise<AccountBalance> {
  await latency(60, 150);
  return { balance: 500 };
}

export async function listDnsRecords(domainName: string): Promise<DnsRecord[]> {
  await latency(100, 260);
  if (!state.records.has(domainName)) {
    if (!state.registered.has(domainName)) {
      throw new NameComError({ code: "NOT_FOUND", rawMessage: "That domain doesn't exist." });
    }
    state.records.set(domainName, []);
  }
  return state.records.get(domainName)!;
}

export async function createDnsRecord(domainName: string, input: DnsRecordInput): Promise<DnsRecord> {
  await latency(150, 350);
  const list = state.records.get(domainName);
  if (!list) throw new NameComError({ code: "NOT_FOUND", rawMessage: "That domain doesn't exist." });
  const record: DnsRecord = {
    id: state.nextRecordId++,
    domainName,
    host: input.host,
    fqdn: `${input.host ? input.host + "." : ""}${domainName}.`,
    type: input.type,
    answer: input.answer,
    ttl: input.ttl ?? 300,
    priority: input.priority,
  };
  list.push(record);
  return record;
}

export async function updateDnsRecord(domainName: string, id: number, input: DnsRecordInput): Promise<DnsRecord> {
  await latency(150, 350);
  const list = state.records.get(domainName);
  const idx = list?.findIndex((r) => r.id === id) ?? -1;
  if (!list || idx === -1) throw new NameComError({ code: "NOT_FOUND", rawMessage: "That record doesn't exist." });
  const updated: DnsRecord = { ...list[idx], host: input.host, type: input.type, answer: input.answer, ttl: input.ttl ?? 300, priority: input.priority };
  list[idx] = updated;
  return updated;
}

export async function deleteDnsRecord(domainName: string, id: number): Promise<void> {
  await latency(100, 250);
  const list = state.records.get(domainName);
  if (!list) throw new NameComError({ code: "NOT_FOUND", rawMessage: "That domain doesn't exist." });
  const idx = list.findIndex((r) => r.id === id);
  if (idx === -1) throw new NameComError({ code: "NOT_FOUND", rawMessage: "That record doesn't exist." });
  list.splice(idx, 1);
}
