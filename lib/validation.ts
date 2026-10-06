import type { DnsRecordType } from "./namecom/types";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/** name.com's documented TTL bounds for DNS records (seconds). */
export const TTL_MIN = 300;
export const TTL_MAX = 86400;

const IPV4_RE = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
const IPV6_RE = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
const HOSTNAME_RE = /^(?=.{1,253}$)([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z]{2,63}\.?$/;
// Labels may start with "_" for service records (_dmarc, selector._domainkey,
// _agent-discovery), and the first label may be a "*" wildcard.
const HOST_LABEL_RE = /^(@|(\*|_?[a-zA-Z0-9]([a-zA-Z0-9-_]{0,61}[a-zA-Z0-9])?)(\._?[a-zA-Z0-9]([a-zA-Z0-9-_]{0,61}[a-zA-Z0-9])?)*)$/;

export interface DnsRecordDraft {
  type: DnsRecordType | "";
  host: string;
  answer: string;
  ttl: number;
  priority?: number;
}

export function validateDnsRecord(draft: DnsRecordDraft): ValidationResult {
  const errors: string[] = [];

  if (!draft.type) {
    errors.push("Choose a record type.");
    return { valid: false, errors };
  }

  if (draft.host === undefined || draft.host === null || draft.host.trim() === "") {
    errors.push("Host is required. Use \"@\" for the root domain.");
  } else if (!HOST_LABEL_RE.test(draft.host.trim())) {
    errors.push("That host isn't valid. Use \"@\", \"www\", or a subdomain like \"mail\".");
  }

  if (!Number.isFinite(draft.ttl) || draft.ttl < TTL_MIN || draft.ttl > TTL_MAX) {
    errors.push(`TTL must satisfy the provider's supported minimum (${TTL_MIN}–${TTL_MAX} seconds).`);
  }

  if (!draft.answer || draft.answer.trim() === "") {
    errors.push("Value is required.");
    return { valid: errors.length === 0, errors };
  }

  const answer = draft.answer.trim();

  switch (draft.type) {
    case "A":
      if (!IPV4_RE.test(answer)) errors.push("That isn't a valid IPv4 address.");
      break;
    case "AAAA":
      if (!IPV6_RE.test(answer)) errors.push("That isn't a valid IPv6 address.");
      break;
    case "CNAME":
    case "ANAME":
    case "NS":
      if (!HOSTNAME_RE.test(answer)) errors.push("That isn't a valid hostname.");
      if (draft.type === "CNAME" && draft.host.trim() === "@") {
        errors.push("A CNAME record can't be set on the root domain (\"@\"). Use an A or ANAME record instead.");
      }
      break;
    case "MX":
      if (!HOSTNAME_RE.test(answer)) errors.push("That isn't a valid mail server hostname.");
      if (draft.priority === undefined || draft.priority === null || Number.isNaN(draft.priority)) {
        errors.push("MX records require a priority.");
      } else if (draft.priority < 0 || draft.priority > 65535) {
        errors.push("MX priority must be between 0 and 65535.");
      }
      break;
    case "SRV": {
      if (draft.priority === undefined || draft.priority === null || Number.isNaN(draft.priority)) {
        errors.push("SRV records require a priority.");
      }
      const parts = answer.split(/\s+/);
      if (parts.length !== 3) {
        errors.push("SRV value must be \"weight port target\" (three space-separated values).");
      }
      break;
    }
    case "TXT":
      if (answer.length > 2048) errors.push("TXT value is too long (2048 character max).");
      break;
  }

  return { valid: errors.length === 0, errors };
}

export function isValidDomainSlug(slug: string): boolean {
  return /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(slug);
}
