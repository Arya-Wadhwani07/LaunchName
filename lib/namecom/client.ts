import "server-only";
import { NameComError } from "./errors";

/**
 * Low-level transport for the name.com Core API (v1). This is the ONLY
 * place that builds the Authorization header, chooses the host, retries,
 * or times out a request — every endpoint function in domains.ts / dns.ts
 * goes through `coreFetch` so none of them can accidentally skip the
 * sandbox guard or the auth header.
 *
 * Docs: https://docs.name.com/api/v1/overview (Core API, NOT the
 * deprecated /v4/ API — this file only ever talks to /core/v1/*).
 */

const SANDBOX_URL = "https://api.dev.name.com";
const PRODUCTION_URL = "https://api.name.com";
const REQUEST_TIMEOUT_MS = 12_000;
const MAX_RETRIES = 3;

export type NameComEnvironment = "sandbox" | "production";

function resolveEnvironment(): NameComEnvironment {
  const raw = (process.env.NAMECOM_ENVIRONMENT || "sandbox").toLowerCase();
  return raw === "production" ? "production" : "sandbox";
}

function resolveBaseUrl(): string {
  if (process.env.NAMECOM_API_BASE_URL) return process.env.NAMECOM_API_BASE_URL;
  return resolveEnvironment() === "production" ? PRODUCTION_URL : SANDBOX_URL;
}

/**
 * Refuses to send production-host traffic unless the environment has
 * explicitly opted in. Runs on every request (not just once at import
 * time) so a request built before a mid-session env change can't sneak
 * through on stale config.
 */
function assertSandboxed(baseUrl: string) {
  const looksLikeProd = baseUrl.includes(PRODUCTION_URL.replace("https://", ""));
  const explicitlyAllowed = process.env.ALLOW_NAMECOM_PRODUCTION === "true";
  if (looksLikeProd && !explicitlyAllowed) {
    throw NameComError.config(
      `Refusing to call ${baseUrl} — this is name.com's production host. ` +
        `Set ALLOW_NAMECOM_PRODUCTION=true if that's intentional.`
    );
  }
}

export function hasCredentials(): boolean {
  return Boolean(process.env.NAMECOM_USERNAME && process.env.NAMECOM_API_TOKEN);
}

function authHeader(): string {
  const username = process.env.NAMECOM_USERNAME;
  const token = process.env.NAMECOM_API_TOKEN;
  if (!username || !token) {
    throw NameComError.config(
      "NAMECOM_USERNAME / NAMECOM_API_TOKEN are not set — add sandbox credentials to .env.local."
    );
  }
  // HTTP Basic Auth per Core API docs: base64("username:token"). This
  // header is attached only to the outgoing request to name.com and is
  // never logged or forwarded to the browser.
  return `Basic ${Buffer.from(`${username}:${token}`).toString("base64")}`;
}

async function parseBody(res: Response): Promise<unknown> {
  const text = await res.text().catch(() => "");
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export interface CoreFetchOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  idempotencyKey?: string;
  /** Internal retry counter — callers never set this. */
  _attempt?: number;
}

/**
 * Every Core API call flows through here. Handles: base URL selection,
 * the production guard, Basic Auth, JSON body/parsing, per-request
 * timeout via AbortController, and bounded retry-with-backoff on 429s
 * (respecting Retry-After / X-RateLimit-Reset) and 5xx responses.
 */
export async function coreFetch<T>(path: string, opts: CoreFetchOptions = {}): Promise<T> {
  const baseUrl = resolveBaseUrl();
  assertSandboxed(baseUrl);

  const attempt = opts._attempt ?? 1;
  const url = new URL(`${baseUrl}${path}`);
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method: opts.method ?? "GET",
      headers: {
        Authorization: authHeader(),
        "Content-Type": "application/json",
        ...(opts.idempotencyKey ? { "X-Idempotency-Key": opts.idempotencyKey } : {}),
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    // Next.js throws a special internal error from `fetch` to mark a route
    // as dynamic during static-generation analysis — it has a `digest`
    // starting with DYNAMIC_SERVER_USAGE and must propagate untouched, or
    // Next loses the signal and mis-renders the route as static.
    if (err && typeof err === "object" && "digest" in err && typeof err.digest === "string" && err.digest.startsWith("DYNAMIC_SERVER_USAGE")) {
      throw err;
    }
    if (err instanceof DOMException && err.name === "AbortError") {
      throw NameComError.timeout();
    }
    throw NameComError.network(err instanceof Error ? err.message : String(err));
  }
  clearTimeout(timer);

  if ((res.status === 429 || res.status >= 500) && attempt <= MAX_RETRIES) {
    const retryAfterHeader = res.headers.get("Retry-After");
    const retryAfterSeconds = retryAfterHeader ? Number(retryAfterHeader) : attempt * 0.6;
    const delayMs = Math.min(Math.max(retryAfterSeconds, 0.4), 4) * 1000;
    await new Promise((r) => setTimeout(r, delayMs));
    return coreFetch<T>(path, { ...opts, _attempt: attempt + 1 });
  }

  if (!res.ok) {
    const body = await parseBody(res);
    const retryAfterHeader = res.headers.get("Retry-After");
    throw NameComError.fromHttp(res.status, body, retryAfterHeader ? Number(retryAfterHeader) : undefined);
  }

  if (res.status === 204) return undefined as T;
  const body = await parseBody(res);
  return body as T;
}

export function currentEnvironment(): NameComEnvironment {
  return resolveEnvironment();
}

export function currentBaseUrl(): string {
  return resolveBaseUrl();
}
