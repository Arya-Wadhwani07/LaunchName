"use client";

import { useEffect, useRef } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useLaunch } from "@/context/LaunchContext";
import { BrandCard, BrandCardSkeleton } from "./BrandCard";
import { ErrorState } from "@/components/ui/status";
import type { BrandSuggestion } from "@/lib/brand";

export function BrandStep() {
  const { state, dispatch } = useLaunch();
  // Only dedupes React Strict Mode's double effect; whether brands are
  // already loaded lives in the shared wizard state so it survives Back.
  const inFlight = useRef<string | null>(null);

  useEffect(() => {
    if (!state.hydrated || !state.idea) return;
    if (state.brandsFor === state.idea || state.brandsLoading || inFlight.current === state.idea) return;
    inFlight.current = state.idea;
    loadBrands();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.hydrated, state.idea, state.brandsFor]);

  async function loadBrands() {
    const idea = state.idea;
    dispatch({ type: "BRANDS_LOADING" });
    try {
      const res = await fetch("/api/brand/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? "Couldn't generate brand names.");
      dispatch({ type: "BRANDS_SUCCESS", brands: data.brands, forIdea: idea });
    } catch (err) {
      dispatch({ type: "BRANDS_ERROR", error: err instanceof Error ? err.message : "Something went wrong." });
    }
  }

  function explore(brand: BrandSuggestion) {
    dispatch({ type: "SELECT_BRAND", brand });
    dispatch({ type: "SET_STEP", step: "capabilities" });
  }

  return (
    <Box sx={{ mx: "auto", maxWidth: 960, px: 3, py: 8 }}>
      <Box sx={{ mb: 5, textAlign: "center" }}>
        <Typography sx={{ mb: 1, fontFamily: "mono", fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "secondary.light" }}>
          Step 1 · Brand discovery
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 600, letterSpacing: "-0.01em" }}>
          Names built for &ldquo;{state.idea}&rdquo;
        </Typography>
        <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
          Curated candidates, pick one to see live domain availability.
        </Typography>
      </Box>

      {state.brandsError && <ErrorState description={state.brandsError} onRetry={loadBrands} />}

      {!state.brandsError && (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr" }, gap: 2 }}>
          {state.brandsLoading
            ? Array.from({ length: 6 }).map((_, i) => <BrandCardSkeleton key={i} />)
            : state.brands.map((brand, i) => (
                <Box key={brand.name} className="stagger-item" style={{ "--stagger-index": i } as React.CSSProperties}>
                  <BrandCard brand={brand} onExplore={explore} selected={state.selectedBrand?.name === brand.name} />
                </Box>
              ))}
        </Box>
      )}
    </Box>
  );
}
