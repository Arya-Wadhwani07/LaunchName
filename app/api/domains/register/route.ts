import { NextResponse } from "next/server";
import { checkAvailability, registerDomain, NameComError } from "@/lib/namecom";
import { DEMO_CONTACTS } from "@/lib/demoContact";
import { createLaunch, appendActivity } from "@/lib/store";
import { markCapability } from "@/lib/apiStatus";
import { errorResponse, badRequest } from "@/lib/http";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const domainName = typeof body.domainName === "string" ? body.domainName.trim().toLowerCase() : "";
  const years = Number(body.years);
  const privacyEnabled = Boolean(body.privacyEnabled);
  const purchasePrice = typeof body.purchasePrice === "number" ? body.purchasePrice : undefined;
  const idea = typeof body.idea === "string" ? body.idea : "";
  const brandName = typeof body.brandName === "string" ? body.brandName : domainName.split(".")[0];
  const tagline = typeof body.tagline === "string" ? body.tagline : "";
  const personality: string[] = Array.isArray(body.personality) ? body.personality : [];

  if (!domainName) return badRequest("Missing 'domainName'.");
  // 1-10 is name.com's own outer bound (Core API's `years` field caps at
  // 10) — the tighter, TLD-specific range (e.g. .ai disallows 1 year) is
  // enforced by name.com itself on the actual registration call below,
  // since it can vary per TLD and the UI already fetches it to constrain
  // what's selectable in the first place.
  if (!Number.isInteger(years) || years < 1 || years > 10) return badRequest("Registration period must be between 1 and 10 years.");

  try {
    // Availability can change between the search screen and the moment
    // someone clicks "Secure this domain" — re-confirm right before we
    // spend money, exactly as name.com's own reseller guide recommends.
    const [recheck] = await checkAvailability([domainName]);
    markCapability("availability");
    if (!recheck || !recheck.purchasable) {
      return NextResponse.json(
        {
          error: {
            code: "CONFLICT",
            message: "This domain was just registered by someone else. Let's find another.",
          },
        },
        { status: 409 }
      );
    }

    const result = await registerDomain({
      domainName,
      years,
      privacyEnabled,
      purchasePrice: recheck.purchasePrice ?? purchasePrice,
      contacts: DEMO_CONTACTS,
    });
    markCapability("registration");

    const launch = createLaunch({
      domainName,
      idea,
      brandName,
      tagline,
      personality,
      years,
      privacyEnabled,
      totalPaid: result.totalPaid,
    });
    appendActivity(domainName, `Registration confirmed for ${domainName}`);

    return NextResponse.json({ domain: result.domain, order: result.order, totalPaid: result.totalPaid, launch });
  } catch (err) {
    if (err instanceof NameComError && err.code === "CONFLICT") {
      return NextResponse.json(
        { error: { code: "CONFLICT", message: "This domain was just registered by someone else. Let's find another." } },
        { status: 409 }
      );
    }
    return errorResponse(err);
  }
}
