/**
 * Types mirroring the name.com Core API (v1) schema, trimmed to the fields
 * this app actually reads or writes. Source of truth: the Core API OpenAPI
 * spec at docs.name.com (v1.33.4) — NOT the deprecated /v4/ API.
 */

export type PurchaseType =
  | "registration"
  | "aftermarket_i"
  | "expiring"
  | "backorder"
  | "aftermarket_s"
  | "aftermarket_b";

export interface SearchResult {
  domainName: string;
  sld: string;
  tld: string;
  purchasable: boolean;
  premium?: boolean;
  purchaseType?: PurchaseType;
  purchasePrice?: number;
  renewalPrice?: number;
  reason?: string;
}

export interface Contact {
  firstName?: string | null;
  lastName?: string | null;
  companyName?: string | null;
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
  email?: string | null;
  phone?: string | null;
  fax?: string | null;
}

export interface Contacts {
  registrant?: Contact;
  admin?: Contact;
  tech?: Contact;
  billing?: Contact;
}

export interface Domain {
  domainName: string;
  createDate?: string;
  expireDate?: string;
  autorenewEnabled?: boolean;
  locked?: boolean;
  locks?: string[];
  privacyEnabled?: boolean;
  contacts?: Contacts;
  nameservers?: string[];
  renewalPrice?: number;
}

export interface CreateDomainRequest {
  domain: {
    domainName: string;
    autorenewEnabled?: boolean;
    locked?: boolean;
    privacyEnabled?: boolean;
    contacts?: Contacts;
    nameservers?: string[];
  };
  purchasePrice?: number;
  purchaseType?: PurchaseType;
  years?: number;
}

export interface CreateDomainResponse {
  domain: Domain;
  /** Order ID for this purchase — an identifier, not the full Order object (see GET /orders/{orderId} for that). */
  order: number;
  totalPaid: number;
}

export type DnsRecordType = "A" | "AAAA" | "ANAME" | "CNAME" | "MX" | "NS" | "SRV" | "TXT";

export interface DnsRecord {
  id?: number;
  domainName?: string;
  host: string | null;
  fqdn?: string;
  type: DnsRecordType | null;
  answer: string;
  ttl: number;
  priority?: number;
}

export interface DnsRecordInput {
  host: string;
  type: DnsRecordType;
  answer: string;
  ttl?: number;
  priority?: number;
}

export interface ListDnsRecordsResponse {
  records: DnsRecord[];
  totalCount: number;
  from: number;
  to: number;
}

export interface PricingResult {
  premium: boolean;
  purchasePrice: number | null;
  renewalPrice: number | null;
  transferPrice: number | null;
}

/**
 * A trimmed view of name.com's per-TLD requirements — just the field the
 * UI actually needs. .ai, for example, only allows 2-10 year terms (no
 * 1-year option); .co caps out at 5. This must come from the API per TLD
 * rather than being hardcoded, since it varies and can change.
 */
export interface TldRequirements {
  tld: string;
  allowedRegistrationYears: number[];
  supportsPrivacy: boolean;
  supportsPremium: boolean;
}

export interface ListDomainsResponse {
  domains: Domain[];
  totalCount?: number;
}

export interface AccountBalance {
  balance: number;
}

/** Which name.com provider is actually answering calls right now. */
export type NameComMode = "live" | "mock";
