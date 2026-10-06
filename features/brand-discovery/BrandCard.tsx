"use client";

import { Badge, Button } from "@/components/ui/primitives";
import type { BrandSuggestion } from "@/lib/brand";

export function BrandCard({
  brand,
  onExplore,
  selected = false,
}: {
  brand: BrandSuggestion;
  onExplore: (brand: BrandSuggestion) => void;
  selected?: boolean;
}) {
  return (
    <div
      className={`elevate flex h-full flex-col justify-between gap-4 rounded-lg border bg-surface p-5 shadow-elevation-1 ${
        selected ? "border-accent/70 shadow-glow-accent" : "border-surface-border hover:border-ink/15"
      }`}
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-semibold tracking-tight text-ink">{brand.name}</h3>
          {selected && <Badge variant="accent">Your pick</Badge>}
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{brand.tagline}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {brand.personality.map((trait) => (
            <Badge key={trait} variant="neutral">
              {trait}
            </Badge>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5 font-mono text-[11px] text-ink-faint">
          {brand.domainSlugs.slice(0, 3).map((slug) => (
            <span key={slug} className="rounded border border-surface-border px-1.5 py-0.5">
              {slug}.com
            </span>
          ))}
        </div>
      </div>
      <Button variant={selected ? "primary" : "secondary"} onClick={() => onExplore(brand)}>
        {selected ? "Continue with this brand →" : "Explore domains →"}
      </Button>
    </div>
  );
}

export function BrandCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-surface-border bg-surface p-5">
      <div className="skeleton h-5 w-32 animate-shimmer rounded" />
      <div className="skeleton h-10 w-full animate-shimmer rounded" />
      <div className="flex gap-1.5">
        <div className="skeleton h-5 w-16 animate-shimmer rounded-full" />
        <div className="skeleton h-5 w-16 animate-shimmer rounded-full" />
      </div>
      <div className="skeleton h-9 w-full animate-shimmer rounded-md" />
    </div>
  );
}
