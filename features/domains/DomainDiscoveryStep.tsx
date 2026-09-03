"use client";

import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import { useLaunch } from "@/context/LaunchContext";
import { DomainCard, DomainCardSkeleton, type DomainResultItem } from "@/components/domain/DomainCard";
import { ErrorState, EmptyState } from "@/components/ui/status";
import { Button } from "@/components/ui/primitives";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "popular", label: "Popular" },
  { key: "ai", label: "AI" },
  { key: "startup", label: "Startup" },
  { key: "developer", label: "Developer" },
  { key: "affordable", label: "Affordable" },
] as const;

export function DomainDiscoveryStep() {
  const { state, dispatch } = useLaunch();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const [compare, setCompare] = useState<string[]>([]);
  const fetchedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!state.selectedBrand || fetchedFor.current === state.selectedBrand.name) return;
    fetchedFor.current = state.selectedBrand.name;
    loadDomains();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.selectedBrand]);

  async function loadDomains() {
    if (!state.selectedBrand) return;
    dispatch({ type: "DOMAINS_LOADING" });
    try {
      const res = await fetch("/api/domains/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandName: state.selectedBrand.name, extraSlugs: state.selectedBrand.domainSlugs }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? "Couldn't check domain availability.");
      const errorItems: DomainResultItem[] = (data.errors ?? []).map((e: { domainName: string; message: string }) => ({
        domainName: e.domainName,
        sld: e.domainName.split(".")[0],
        tld: e.domainName.split(".").slice(1).join("."),
        purchasable: false,
        errorMessage: e.message,
      }));
      dispatch({
        type: "DOMAINS_SUCCESS",
        results: [...data.results, ...errorItems],
        bestPick: data.bestPick ?? null,
        bestAgentPick: data.bestAgentPick ?? null,
      });
    } catch (err) {
      dispatch({ type: "DOMAINS_ERROR", error: err instanceof Error ? err.message : "Something went wrong." });
    }
  }

  function selectDomain(item: DomainResultItem) {
    dispatch({ type: "SELECT_DOMAIN", domain: item });
  }

  function toggleCompare(domainName: string) {
    setCompare((c) => (c.includes(domainName) ? c.filter((d) => d !== domainName) : c.length < 3 ? [...c, domainName] : c));
  }

  const filtered = state.domainResults.filter((r) => filter === "all" || r.categories?.includes(filter));
  const compareItems = state.domainResults.filter((r) => compare.includes(r.domainName));

  return (
    <Box sx={{ mx: "auto", maxWidth: 960, px: 3, py: 8 }}>
      <Box sx={{ mb: 4, textAlign: "center" }}>
        <Typography sx={{ mb: 1, fontFamily: "mono", fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "secondary.light" }}>
          Step 3 · Domain discovery
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 600, letterSpacing: "-0.01em" }}>
          Live availability for {state.selectedBrand?.name}
        </Typography>
        <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
          {state.agentEnabled
            ? "Checked in real time against name.com, scored for both human branding and agent discoverability."
            : "Checked in real time against name.com, prices are exactly what you'd pay today."}
        </Typography>
      </Box>

      <Box sx={{ mb: 3, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 1 }}>
        {FILTERS.map((f) => (
          <Chip
            key={f.key}
            label={f.label}
            size="small"
            variant={filter === f.key ? "filled" : "outlined"}
            onClick={() => setFilter(f.key)}
            sx={
              filter === f.key
                ? { bgcolor: "rgba(124,92,255,0.12)", color: "primary.light", borderColor: "rgba(124,92,255,0.5)", border: "1px solid" }
                : { color: "text.secondary" }
            }
          />
        ))}
      </Box>

      {state.domainsError && <ErrorState description={state.domainsError} onRetry={loadDomains} />}

      {!state.domainsError && state.domainsLoading && (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr" }, gap: 2 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <DomainCardSkeleton key={i} />
          ))}
        </Box>
      )}

      {!state.domainsError && !state.domainsLoading && filtered.length === 0 && (
        <EmptyState title="No domains match this filter" description="Try a different filter, or go back and pick another brand." />
      )}

      {!state.domainsError && !state.domainsLoading && filtered.length > 0 && (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr" }, gap: 2, pb: compare.length > 0 ? 12 : 0 }}>
          {filtered.map((item, i) => (
            <Box
              key={item.domainName}
              className="stagger-item"
              style={{ "--stagger-index": Math.min(i, 12) } as React.CSSProperties}
            >
              <DomainCard
                item={item}
                isBestPick={item.domainName === state.bestPickDomain}
                isBestAgentPick={state.agentEnabled && item.domainName === state.bestAgentPickDomain}
                agentMode={state.agentEnabled}
                selected={state.selectedDomain?.domainName === item.domainName}
                onSelect={selectDomain}
                selectLabel={state.agentEnabled ? "Make this my agent" : "Select"}
                compareAction={
                  item.purchasable && !item.errorMessage ? (
                    <Chip
                      label={compare.includes(item.domainName) ? "Comparing" : "Compare"}
                      size="small"
                      onClick={() => toggleCompare(item.domainName)}
                      sx={{
                        height: 20,
                        fontSize: "0.625rem",
                        ...(compare.includes(item.domainName)
                          ? { bgcolor: "rgba(124,92,255,0.18)", color: "primary.light", border: "1px solid rgba(124,92,255,0.5)" }
                          : { bgcolor: "background.paper", color: "text.disabled", border: "1px solid", borderColor: "divider" }),
                      }}
                    />
                  ) : undefined
                }
              />
            </Box>
          ))}
        </Box>
      )}

      {compareItems.length > 0 && (
        <Box
          sx={{
            position: "fixed",
            insetInline: 0,
            bottom: 0,
            zIndex: 40,
            borderTop: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
            backdropFilter: "blur(8px)",
          }}
        >
          <Box sx={{ mx: "auto", maxWidth: 960, display: "flex", alignItems: "center", gap: 2, overflowX: "auto", px: 3, py: 1.5 }}>
            <Typography variant="caption" sx={{ flexShrink: 0, color: "text.disabled" }}>
              Comparing
            </Typography>
            {compareItems.map((item) => (
              <Box
                key={item.domainName}
                sx={{
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  borderRadius: 1.5,
                  border: 1,
                  borderColor: "divider",
                  bgcolor: "background.default",
                  px: 1.5,
                  py: 0.75,
                }}
              >
                <Typography sx={{ fontFamily: "mono", fontSize: "0.75rem" }}>{item.domainName}</Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  ${item.purchasePrice?.toFixed(2)}
                </Typography>
                <Button size="sm" onClick={() => selectDomain(item)}>
                  Choose
                </Button>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}
