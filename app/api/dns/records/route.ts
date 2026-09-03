import { NextResponse } from "next/server";
import { listDnsRecords, createDnsRecord } from "@/lib/namecom";
import { markCapability } from "@/lib/apiStatus";
import { appendActivity } from "@/lib/store";
import { validateDnsRecord } from "@/lib/validation";
import { errorResponse, badRequest } from "@/lib/http";
import type { DnsRecordType } from "@/lib/namecom/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const domain = searchParams.get("domain");
  if (!domain) return badRequest("Missing 'domain' query parameter.");

  try {
    const records = await listDnsRecords(domain);
    markCapability("dns");
    return NextResponse.json({ records });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const domain = typeof body.domain === "string" ? body.domain : "";
  if (!domain) return badRequest("Missing 'domain'.");

  const draft = {
    type: body.type as DnsRecordType,
    host: typeof body.host === "string" ? body.host : "",
    answer: typeof body.answer === "string" ? body.answer : "",
    ttl: Number(body.ttl ?? 300),
    priority: body.priority !== undefined ? Number(body.priority) : undefined,
  };
  const validation = validateDnsRecord(draft);
  if (!validation.valid) {
    return NextResponse.json({ error: { code: "VALIDATION", message: validation.errors[0], details: validation.errors.join(" ") } }, { status: 400 });
  }

  try {
    const record = await createDnsRecord(domain, draft);
    markCapability("dns");
    appendActivity(domain, `DNS record added: ${draft.type} ${draft.host}`);
    return NextResponse.json({ record });
  } catch (err) {
    return errorResponse(err);
  }
}
