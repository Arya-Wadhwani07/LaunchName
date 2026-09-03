import { NextResponse } from "next/server";
import { resolveDomain } from "@/lib/agents/discovery";

export const dynamic = "force-dynamic";

/** Domain-bound discovery: resolve a root domain to every agent LaunchName knows is published under it. */
export async function GET(_req: Request, { params }: { params: { domain: string } }) {
  const domain = decodeURIComponent(params.domain).toLowerCase();
  const index = resolveDomain(domain);
  return NextResponse.json({ index });
}
