import { NextResponse } from "next/server";
import { getDomain } from "@/lib/namecom";
import { getLaunch } from "@/lib/store";
import { errorResponse } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { domainName: string } }) {
  const domainName = decodeURIComponent(params.domainName);
  try {
    const domain = await getDomain(domainName);
    return NextResponse.json({ domain, launch: getLaunch(domainName) ?? null });
  } catch (err) {
    return errorResponse(err);
  }
}
