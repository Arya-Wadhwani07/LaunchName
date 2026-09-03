import { NextResponse } from "next/server";
import { getLaunchBySlug } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const launch = getLaunchBySlug(params.slug);
  if (!launch) return NextResponse.json({ error: { code: "NOT_FOUND", message: "No launch found." } }, { status: 404 });
  return NextResponse.json({ launch });
}
