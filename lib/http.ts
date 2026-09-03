import { NextResponse } from "next/server";
import { NameComError } from "./namecom/errors";

const STATUS_FOR_CODE: Record<string, number> = {
  UNAUTHORIZED: 502,
  FORBIDDEN: 502,
  NOT_FOUND: 404,
  VALIDATION: 400,
  RATE_LIMITED: 429,
  PAYMENT_REQUIRED: 402,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  TIMEOUT: 504,
  NETWORK: 502,
  SERVER_ERROR: 502,
  UNKNOWN: 500,
};

/**
 * Every API route funnels caught errors through here so the browser never
 * sees a raw stack trace or a name.com implementation detail — just a
 * stable {error: {code, message}} shape the UI already knows how to
 * render (see components/ui/status.tsx ErrorState).
 */
export function errorResponse(err: unknown) {
  if (err instanceof NameComError) {
    console.error(`[namecom:${err.code}]`, err.status, err.details ?? err.message);
    return NextResponse.json(
      { error: { code: err.code, message: err.friendlyMessage, details: err.details } },
      { status: STATUS_FOR_CODE[err.code] ?? 500 }
    );
  }
  if (err instanceof Error) {
    console.error("[api:error]", err.message, err.stack);
    return NextResponse.json({ error: { code: "UNKNOWN", message: "Something unexpected happened. Try again." } }, { status: 500 });
  }
  console.error("[api:error]", err);
  return NextResponse.json({ error: { code: "UNKNOWN", message: "Something unexpected happened. Try again." } }, { status: 500 });
}

export function badRequest(message: string) {
  return NextResponse.json({ error: { code: "VALIDATION", message } }, { status: 400 });
}
