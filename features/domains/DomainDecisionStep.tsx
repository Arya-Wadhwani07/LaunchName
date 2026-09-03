"use client";

import { useEffect, useState } from "react";
import { useLaunch } from "@/context/LaunchContext";
import { Button, Switch } from "@/components/ui/primitives";
import { Skeleton } from "@/components/ui/data";
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

  return (
    <div className="mx-auto max-w-lg px-6 py-16">
      <div className="mb-2 text-center font-mono text-xs uppercase tracking-widest text-accent-soft">Step 4 · Confirm your domain</div>

      <div className="rounded-xl border border-surface-border bg-surface p-6 shadow-elevation-2">
        <div className="text-center">
          <div className="font-mono text-2xl tracking-tight text-ink">
            {sld}
            <span className="text-ink-faint">.{tld}</span>
          </div>
        </div>

        <ul className="mx-auto mt-5 flex max-w-xs flex-col gap-2">
          {["Available", "Registration supported", "Privacy available", "Ready to launch"].map((label) => (
            <li key={label} className="flex items-center gap-2 text-sm text-ink-muted">
              <span className="text-good">✓</span>
              {label}
            </li>
          ))}
        </ul>

        <div className="my-6 border-t border-surface-border" />

        <div className="mb-4">
          <div className="mb-2 text-xs text-ink-faint">
            Registration period
            {tld === "ai" && <span className="text-ink-faint"> (.ai requires at least 2 years)</span>}
          </div>
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

        <Switch
          checked={state.privacyEnabled}
          onChange={(v) => dispatch({ type: "SET_PRIVACY", enabled: v })}
          label="WHOIS privacy"
          hint="Keeps your registration contact info out of public WHOIS lookups"
        />

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
              <span>Renews at</span>
              <span>${renewal.toFixed(2)}/yr</span>
            </div>
            <div className="flex justify-between pt-2 text-base font-semibold text-ink">
              <span>Estimated total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        )}

        <Button size="lg" className="mt-6 w-full" onClick={onSecure} disabled={!yearsReady || pricingLoading}>
          Secure this domain
        </Button>
        <p className="mt-3 text-center text-[11px] text-ink-faint">
          Runs against name.com&apos;s sandbox environment. No real card is charged.
        </p>
      </div>
    </div>
  );
}
