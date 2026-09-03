import { NextResponse } from "next/server";
import { getTldRequirements } from "@/lib/namecom";
import { errorResponse, badRequest } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Drives the registration-period UI — some TLDs (.ai) disallow 1-year terms, others (.co) cap the maximum, and it varies TLD to TLD. */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tld = searchParams.get("tld");
  if (!tld) return badRequest("Missing 'tld' query parameter.");

  try {
    const requirements = await getTldRequirements(tld);
    return NextResponse.json({ requirements });
  } catch (err) {
    return errorResponse(err);
  }
}
