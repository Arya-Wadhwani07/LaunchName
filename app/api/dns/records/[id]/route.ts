import { NextResponse } from "next/server";
import { updateDnsRecord, deleteDnsRecord } from "@/lib/namecom";
import { markCapability } from "@/lib/apiStatus";
import { appendActivity } from "@/lib/store";
import { validateDnsRecord } from "@/lib/validation";
import { errorResponse, badRequest } from "@/lib/http";
import type { DnsRecordType } from "@/lib/namecom/types";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) return badRequest("Invalid record id.");

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
    const record = await updateDnsRecord(domain, id, draft);
    markCapability("dns");
    appendActivity(domain, `DNS record updated: ${draft.type} ${draft.host}`);
    return NextResponse.json({ record });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) return badRequest("Invalid record id.");

  const { searchParams } = new URL(req.url);
  const domain = searchParams.get("domain");
  if (!domain) return badRequest("Missing 'domain' query parameter.");

  try {
    await deleteDnsRecord(domain, id);
    markCapability("dns");
    appendActivity(domain, "DNS record deleted");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
