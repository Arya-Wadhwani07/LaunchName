import { NextResponse } from "next/server";
import { updateLaunchStatus, appendActivity, getLaunch } from "@/lib/store";
import { badRequest } from "@/lib/http";

/** Marks the final "Launch Website" step — the generated landing page is live at /site/[slug]. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const domainName = typeof body.domainName === "string" ? body.domainName.trim().toLowerCase() : "";
  if (!domainName) return badRequest("Missing 'domainName'.");

  const existing = getLaunch(domainName);
  if (!existing) return badRequest("No launch found for that domain.");

  const launch = updateLaunchStatus(domainName, "live");
  appendActivity(domainName, "Launch completed");
  return NextResponse.json({ launch });
}
