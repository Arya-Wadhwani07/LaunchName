import { NextResponse } from "next/server";
import { getPricingForDomain } from "@/lib/namecom";
import { markCapability } from "@/lib/apiStatus";
import { errorResponse, badRequest } from "@/lib/http";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const domain = searchParams.get("domain");
  const years = searchParams.get("years");
  if (!domain) return badRequest("Missing 'domain' query parameter.");

  try {
    const pricing = await getPricingForDomain(domain, years ? Number(years) : undefined);
    markCapability("pricing");
    return NextResponse.json({ pricing });
  } catch (err) {
    return errorResponse(err);
  }
}
