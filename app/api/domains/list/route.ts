import { NextResponse } from "next/server";
import { listDomains } from "@/lib/namecom";
import { markCapability } from "@/lib/apiStatus";
import { getLaunch } from "@/lib/store";
import { errorResponse } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Powers the dashboard's Domains screen — live from name.com, enriched with our own launch metadata where we have it. */
export async function GET() {
  try {
    const domains = await listDomains();
    markCapability("accountInfo");
    const enriched = domains.map((d) => ({ ...d, launch: getLaunch(d.domainName) ?? null }));
    return NextResponse.json({ domains: enriched });
  } catch (err) {
    return errorResponse(err);
  }
}
