"use client";

import { useEffect, useState } from "react";
import { useLaunch } from "@/context/LaunchContext";
import { Button, Switch } from "@/components/ui/primitives";
import { Skeleton } from "@/components/ui/data";
import { HelpTip } from "@/components/ui/HelpTip";
import Typography from "@mui/material/Typography";
import type { PricingResult, TldRequirements } from "@/lib/namecom/types";

export function DomainDecisionStep({ onSecure }: { onSecure: () => void }) {
  const { state, dispatch } = useLaunch();
  const domain = state.selectedDomain;
  const [pricing, setPricing] = useState<PricingResult | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingError, setPricingError] = useState<string | null>(null);
  const [requirements, setRequirements] = useState<TldRequirements | null>(null);
  const [requirementsLoading, setRequirementsLoading] = useState(false);

  const tld = domain ? domain.domainName.split(".").slice(1).join(".") : "";

  // Different TLDs allow different registration terms — .ai requires 2+
  // years, .co caps at 5 — so this has to come from name.com per TLD
  // rather than assuming 1/2/3 always works.
  useEffect(() => {
    if (!tld) return;
    let cancelled = false;
    setRequirementsLoading(true);
    setRequirements(null);
    fetch(`/api/domains/tld-requirements?tld=${encodeURIComponent(tld)}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const req: TldRequirements | undefined = d.requirements;
        setRequirements(req ?? null);
        // Privacy can't be bought for every extension; make sure the
        // registration request matches what the UI is showing.
        if (req && !req.supportsPrivacy && state.privacyEnabled) dispatch({ type: "SET_PRIVACY", enabled: false });
        if (req && !req.allowedRegistrationYears.includes(state.years)) {
          dispatch({ type: "SET_YEARS", years: req.allowedRegistrationYears[0] });
        }
      })
      .catch(() => !cancelled && setRequirements(null))
      .finally(() => !cancelled && setRequirementsLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tld]);

  useEffect(() => {
    if (!domain || !requirements) return;
    // Wait for a years value that's actually valid for this TLD before
    // pricing this domain — otherwise the very first request (still on
    // the old default) would 400 against name.com.
    if (!requirements.allowedRegistrationYears.includes(state.years)) return;

    let cancelled = false;
    setPricingLoading(true);
    setPricingError(null);
    fetch(`/api/domains/pricing?domain=${encodeURIComponent(domain.domainName)}&years=${state.years}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d.error) throw new Error(d.error.message);
        setPricing(d.pricing ?? null);
      })
      .catch((err) => !cancelled && setPricingError(err instanceof Error ? err.message : "Couldn't load pricing."))
      .finally(() => !cancelled && setPricingLoading(false));
    return () => {
      cancelled = true;
    };
  }, [domain, state.years, requirements]);

  if (!domain) return null;

  const [sld] = domain.domainName.split(".");
  const total = pricing?.purchasePrice ?? domain.purchasePrice ?? 0;
  const renewal = pricing?.renewalPrice ?? domain.renewalPrice ?? total;
  const yearOptions = requirements?.allowedRegistrationYears ?? [];
  const yearsReady = yearOptions.includes(state.years);
  const privacySupported = requirements?.supportsPrivacy ?? true;

  return (
    <div className="mx-auto max-w-lg px-6 pb-16 pt-4">
      <header className="mb-6">
        <div className="mb-2 font-mono text-xs uppercase tracking-widest text-accent2">Step 4 of 6 · Confirm</div>
        <Typography variant="h4" component="h1">
          Confirm your domain
        </Typography>
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-muted">Choose how long to register it and whether to keep your contact details private.</p>
      </header>

      <div className="rounded-xl border border-surface-border bg-surface p-6 shadow-elevation-2">
        <div className="text-center">
          <div className="font-mono text-2xl tracking-tight text-ink">
            {sld}
            <span className="text-ink-faint">.{tld}</span>
          </div>
        </div>

        <ul className="mx-auto mt-5 flex max-w-xs flex-col gap-2">
          {[
            { label: "Available to register", ok: true },
            { label: "Registration supported for .".concat(tld), ok: true },
            { label: privacySupported ? "WHOIS privacy available" : "WHOIS privacy not offered for this extension", ok: privacySupported },
          ].map((row) => (
            <li key={row.label} className="flex items-center gap-2 text-sm text-ink-muted">
              <span className={row.ok ? "text-good" : "text-ink-faint"} aria-hidden>
                {row.ok ? "✓" : "–"}
              </span>
              {row.label}
            </li>
          ))}
        </ul>

        <div className="my-6 border-t border-surface-border" />

        <div className="mb-4">
          <div className="mb-2 flex items-center">
            <h2 className="m-0 text-[0.9375rem] font-semibold text-ink">Registration period</h2>
            <HelpTip label="the registration period" title="Registration period">
              How many years you pay for up front. You own the domain for that whole time, then it renews yearly at the renewal price. Some extensions set a minimum: .ai requires at least 2 years.
            </HelpTip>
          </div>
          {yearOptions.length > 0 && yearOptions[0] > 1 && (
            <p className="-mt-1 mb-2 text-xs text-ink-muted">.{tld} requires at least {yearOptions[0]} years.</p>
          )}
          {requirementsLoading ? (
            <Skeleton className="h-9 w-full" />
          ) : (
            <div className="flex flex-wrap gap-2">
              {(yearOptions.length > 0 ? yearOptions : [1, 2, 3]).map((y) => (
                <button
                  key={y}
                  onClick={() => dispatch({ type: "SET_YEARS", years: y })}
                  className={`h-9 min-w-[64px] flex-1 rounded-md border text-sm transition-colors ${
                    state.years === y ? "border-accent/50 bg-accent/10 text-accent-soft" : "border-surface-border text-ink-muted hover:text-ink"
                  }`}
                >
                  {y} {y === 1 ? "year" : "years"}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-start gap-1">
          <div className="flex-1">
            <Switch
              checked={privacySupported && state.privacyEnabled}
              disabled={!privacySupported}
              onChange={(v) => dispatch({ type: "SET_PRIVACY", enabled: v })}
              label="WHOIS privacy"
              hint={
                privacySupported
                  ? "Hides your name, email, phone and address from the public domain directory. Included free."
                  : "This extension doesn't offer privacy, so your registration details will be public."
              }
            />
          </div>
          <HelpTip label="WHOIS privacy" title="What is WHOIS privacy?">
            Every registered domain has a public record (WHOIS) listing who owns it. Without privacy, anyone can look up your name, email, phone number and mailing address, which often leads to spam and scam calls. With privacy on, name.com shows its own forwarding contact instead. You still fully own and control the domain.
          </HelpTip>
        </div>

        <div className="my-6 border-t border-surface-border" />

        {pricingError ? (
          <p className="text-sm text-bad">{pricingError}</p>
        ) : pricingLoading || !yearsReady ? (
          <Skeleton className="h-20 w-full" />
        ) : (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-ink-muted">
              <span>{state.years === 1 ? "First year" : `${state.years}-year total`}</span>
              <span className="text-ink">${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-ink-muted">
              <span className="flex items-center">
                Renews at
                <HelpTip label="the renewal price" title="Renewal price">
                  What you&apos;ll pay each year after the first registration period ends to keep the domain. First-year prices are often discounted, so this can be higher.
                </HelpTip>
              </span>
              <span>${renewal.toFixed(2)}/yr</span>
            </div>
            <div className="flex justify-between border-t border-surface-border pt-3 text-base font-semibold text-ink">
              <span>Estimated total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        )}

        <Button size="lg" sx={{ mt: 8, width: "100%" }} onClick={onSecure} disabled={!yearsReady || pricingLoading}>
          Secure this domain
        </Button>
        <p className="mt-3 text-center text-[11px] text-ink-faint">
          Runs against name.com&apos;s sandbox environment. No real card is charged.
        </p>
      </div>
    </div>
  );
}
