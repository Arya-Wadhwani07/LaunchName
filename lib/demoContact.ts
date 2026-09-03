import type { Contacts } from "./namecom/types";

/**
 * LaunchName never collects a buyer's real WHOIS contact info — this is a
 * hackathon demo running against name.com's sandbox, not a live storefront.
 * Every registration uses this fixed demo registrant so the purchase flow
 * exercises the real Core API without asking anyone for personal data.
 */
const DEMO_PERSON = {
  firstName: "LaunchName",
  lastName: "Demo",
  companyName: "LaunchName Hackathon Demo",
  address1: "1209 Orange St",
  city: "Wilmington",
  state: "DE",
  zip: "19801",
  country: "US",
  email: "demo@launchname.dev",
  // Core API requires E.164-ish digits-only after the "+": /^\+[1-9]\d{7,14}$/
  // (no dots/dashes, unlike the legacy v4 API's "+1.5551234567" format).
  phone: "+15555550100",
};

export const DEMO_CONTACTS: Contacts = {
  registrant: DEMO_PERSON,
  admin: DEMO_PERSON,
  tech: DEMO_PERSON,
  billing: DEMO_PERSON,
};
