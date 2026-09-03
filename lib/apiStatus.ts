import "server-only";

/**
 * Tracks which name.com capabilities this running session has actually
 * exercised, purely so the debug drawer can show judges real evidence
 * ("Domain Search ✓ Complete — 12:03:41") instead of a static checklist.
 */
export type ApiCapability = "search" | "availability" | "pricing" | "registration" | "dns" | "accountInfo";

const LABELS: Record<ApiCapability, string> = {
  search: "Domain Search",
  availability: "Availability Check",
  pricing: "Pricing",
  registration: "Registration",
  dns: "DNS Records",
  accountInfo: "Account Info",
};

interface Status {
  completedAt: string;
  count: number;
}

const g = globalThis as unknown as { __launchnameApiStatus?: Map<ApiCapability, Status> };
if (!g.__launchnameApiStatus) g.__launchnameApiStatus = new Map();
const statusMap = g.__launchnameApiStatus;

export function markCapability(capability: ApiCapability) {
  const existing = statusMap.get(capability);
  statusMap.set(capability, { completedAt: new Date().toISOString(), count: (existing?.count ?? 0) + 1 });
}

export function getCapabilityStatus() {
  return (Object.keys(LABELS) as ApiCapability[]).map((key) => ({
    key,
    label: LABELS[key],
    complete: statusMap.has(key),
    completedAt: statusMap.get(key)?.completedAt,
    count: statusMap.get(key)?.count ?? 0,
  }));
}
