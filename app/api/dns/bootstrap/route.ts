import { NextResponse } from "next/server";
import { createDnsRecord } from "@/lib/namecom";
import { markCapability } from "@/lib/apiStatus";
import { updateLaunchStatus, appendActivity, getLaunch } from "@/lib/store";
import { errorResponse, badRequest } from "@/lib/http";

const FALLBACK_HOST_IP = "76.76.21.21"; // shared front-door IP used by several static-hosting platforms; safe demo default.

/**
 * Creates the DNS records a freshly-registered domain needs to point at
 * its generated LaunchName landing page: an A record at the apex, a
 * friendly "www" CNAME, and a TXT ownership marker. This is the "→
 * Configuring DNS" step in the registration progress UI — every record
 * it creates is a real POST to name.com's Core API.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const domainName = typeof body.domainName === "string" ? body.domainName.trim().toLowerCase() : "";
  if (!domainName) return badRequest("Missing 'domainName'.");

  const launch = getLaunch(domainName);
  if (!launch) return badRequest("Register this domain before configuring DNS.");

  const hostIp = process.env.LANDING_PAGE_HOST_IP || FALLBACK_HOST_IP;
  const verificationToken = `launchname-verify-${launch.id.slice(0, 12)}`;

  try {
    const created = [];
    created.push(await createDnsRecord(domainName, { host: "@", type: "A", answer: hostIp, ttl: 300 }));
    created.push(await createDnsRecord(domainName, { host: "www", type: "CNAME", answer: `${domainName}.`, ttl: 300 }));
    created.push(await createDnsRecord(domainName, { host: "@", type: "TXT", answer: verificationToken, ttl: 300 }));
    markCapability("dns");

    updateLaunchStatus(domainName, "dns_configured");
    appendActivity(domainName, "DNS configured: A, CNAME, and TXT records created");

    return NextResponse.json({ records: created });
  } catch (err) {
    appendActivity(domainName, "DNS configuration needs attention");
    return errorResponse(err);
  }
}
