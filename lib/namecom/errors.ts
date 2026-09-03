/**
 * Every failure mode this app needs to distinguish, mapped from name.com's
 * HTTP status codes. Routes and UI branch on `.code`, never on raw status
 * numbers or message strings, so the mapping only has to live here once.
 */
export type NameComErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION"
  | "RATE_LIMITED"
  | "PAYMENT_REQUIRED"
  | "CONFLICT"
  | "UNPROCESSABLE"
  | "TIMEOUT"
  | "NETWORK"
  | "SERVER_ERROR"
  | "UNKNOWN";

const FRIENDLY_MESSAGES: Record<NameComErrorCode, string> = {
  UNAUTHORIZED: "We couldn't authenticate with the domain provider. Check the API credentials.",
  FORBIDDEN: "The domain provider account doesn't have permission to do that.",
  NOT_FOUND: "That domain or record doesn't exist.",
  VALIDATION: "That request wasn't valid. Double-check the values and try again.",
  RATE_LIMITED: "We're checking too fast. Give it a moment and try again.",
  PAYMENT_REQUIRED: "The account doesn't have enough balance to complete this purchase.",
  CONFLICT: "That change conflicts with something already in progress. Try again.",
  UNPROCESSABLE: "Pricing for this domain isn't available right now.",
  TIMEOUT: "The domain provider took too long to respond. Try again.",
  NETWORK: "We couldn't reach the domain provider. Try again.",
  SERVER_ERROR: "The domain provider is having trouble on their end. Try again shortly.",
  UNKNOWN: "Something unexpected happened. Try again.",
};

function codeFromStatus(status: number): NameComErrorCode {
  switch (status) {
    case 401:
      return "UNAUTHORIZED";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 400:
    case 405:
    case 415:
      return "VALIDATION";
    case 402:
      return "PAYMENT_REQUIRED";
    case 409:
      return "CONFLICT";
    case 422:
      return "UNPROCESSABLE";
    case 429:
      return "RATE_LIMITED";
    default:
      return status >= 500 ? "SERVER_ERROR" : "UNKNOWN";
  }
}

export class NameComError extends Error {
  code: NameComErrorCode;
  status?: number;
  details?: string;
  retryAfterSeconds?: number;

  constructor(opts: {
    code: NameComErrorCode;
    status?: number;
    details?: string;
    retryAfterSeconds?: number;
    rawMessage?: string;
  }) {
    super(opts.rawMessage || FRIENDLY_MESSAGES[opts.code]);
    this.name = "NameComError";
    this.code = opts.code;
    this.status = opts.status;
    this.details = opts.details;
    this.retryAfterSeconds = opts.retryAfterSeconds;
  }

  get friendlyMessage(): string {
    return FRIENDLY_MESSAGES[this.code];
  }

  toJSON() {
    return { code: this.code, message: this.friendlyMessage, details: this.details };
  }

  static fromHttp(status: number, body: unknown, retryAfterSeconds?: number): NameComError {
    const code = codeFromStatus(status);
    let details: string | undefined;
    if (body && typeof body === "object") {
      const b = body as Record<string, unknown>;
      if (typeof b.message === "string") details = b.message;
      else if (typeof b.details === "string") details = b.details;
    } else if (typeof body === "string" && body.trim()) {
      details = body.slice(0, 500);
    }
    return new NameComError({ code, status, details, retryAfterSeconds });
  }

  static timeout(): NameComError {
    return new NameComError({ code: "TIMEOUT" });
  }

  static network(details?: string): NameComError {
    return new NameComError({ code: "NETWORK", details });
  }

  static config(message: string): NameComError {
    return new NameComError({ code: "UNKNOWN", rawMessage: message, details: message });
  }
}
