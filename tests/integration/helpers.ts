import { POST as searchDomains } from "@/app/api/domains/search/route";
import { POST as registerDomain } from "@/app/api/domains/register/route";

export function jsonRequest(path: string, body?: unknown, method = body === undefined ? "GET" : "POST") {
  return new Request(`http://localhost${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export async function call(res: Response | Promise<Response>) {
  const r = await res;
  return { status: r.status, body: await r.json() };
}

/** The mock marks some domains taken deterministically, so look one up instead of hardcoding it. */
export async function findAvailable(brandName: string, tld: string): Promise<string> {
  const { body } = await call(searchDomains(jsonRequest("/api/domains/search", { brandName })));
  const hit = body.results.find((r: any) => r.tld === tld && r.purchasable && !r.premium);
  if (!hit) throw new Error(`No available .${tld} candidate for ${brandName}`);
  return hit.domainName;
}

export async function registerFresh(brandName: string, tld = "com") {
  const domainName = await findAvailable(brandName, tld);
  const res = await call(registerDomain(jsonRequest("/api/domains/register", { domainName, years: 1, privacyEnabled: true, brandName, idea: "test idea" })));
  if (res.status !== 200) throw new Error(`Registration failed: ${JSON.stringify(res.body)}`);
  return domainName;
}
