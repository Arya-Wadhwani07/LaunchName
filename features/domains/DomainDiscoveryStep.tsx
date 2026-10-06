"use client";

import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { HelpTip } from "@/components/ui/HelpTip";
import { filterDomains, type Availability } from "@/lib/domainFilters";
import { useLaunch } from "@/context/LaunchContext";
import { DomainCard, DomainCardSkeleton, type DomainResultItem } from "@/components/domain/DomainCard";
import { ErrorState, EmptyState } from "@/components/ui/status";
import { Button } from "@/components/ui/primitives";

const FILTERS = [
  { key: "all", label: "All", help: "Every extension we checked for this name." },
  { key: "popular", label: "Popular", help: "The most widely recognized extensions, like .com and .co. People trust and remember them." },
  { key: "ai", label: "AI", help: "Extensions associated with AI products, such as .ai. A strong signal if your product or agent is AI-first." },
  { key: "startup", label: "Startup", help: "Extensions popular with new companies, like .io and .app." },
  { key: "developer", label: "Developer", help: "Extensions developers recognize, like .dev, which also enforce HTTPS by default." },
  { key: "affordable", label: "Affordable", help: "Domains with a lower first-year price." },
] as const;


const AVAILABILITY_HELP: Record<Availability, string> = {
  all: "Show every domain we checked, whether you can register it or not.",
  available: "Only domains you can register right now. Prices are live from name.com.",
  taken: "Only domains someone else already owns. Useful to see which names are contested.",
};



export function DomainDiscoveryStep() {
  const { state, dispatch } = useLaunch();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const [availability, setAvailability] = useState<Availability>("all");
  const [compare, setCompare] = useState<string[]>([]);
  const inFlight = useRef<string | null>(null);

  // Saved results for this brand are reused when coming Back from Confirm.
  useEffect(() => {
    if (!state.selectedBrand) return;
    const brand = state.selectedBrand.name;
    if (state.domainsFor === brand || state.domainsLoading || inFlight.current === brand) return;
    inFlight.current = brand;
    loadDomains();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.selectedBrand, state.domainsFor]);

  async function loadDomains() {
    const brand = state.selectedBrand;
    if (!brand) return;
    dispatch({ type: "DOMAINS_LOADING" });
    try {
      const res = await fetch("/api/domains/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandName: brand.name, extraSlugs: brand.domainSlugs }),
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
        forBrand: brand.name,
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

  const { visible: filtered, counts } = filterDomains(state.domainResults, filter, availability);
  const compareItems = state.domainResults.filter((r) => compare.includes(r.domainName));

  return (
    <Box sx={{ mx: "auto", maxWidth: 1040, px: 3, py: 6 }}>
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

      <Box
        component="section"
        aria-label="Filter domains"
        sx={{ mb: 4, display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: { xs: "stretch", md: "center" }, justifyContent: "space-between", gap: 2 }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <Typography variant="overline" sx={{ color: "text.disabled", mr: 0.5 }}>
            Show
          </Typography>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={availability}
            onChange={(_, v: Availability | null) => v && setAvailability(v)}
            aria-label="Filter by availability"
            sx={{
              p: 0.5,
              borderRadius: 999,
              backgroundColor: "#111015",
              boxShadow: "inset 3px 3px 7px rgba(0,0,0,0.6), inset -2px -2px 6px rgba(255,255,255,0.035)",
              "& .MuiToggleButton-root": {
                border: "none",
                borderRadius: "999px !important",
                textTransform: "none",
                px: 1.75,
                py: 0.5,
                fontSize: "0.8125rem",
                color: "text.secondary",
                gap: 0.75,
                "&.Mui-selected": { color: "text.primary", backgroundColor: "#1d1b24", boxShadow: "3px 3px 8px rgba(0,0,0,0.55), -2px -2px 6px rgba(255,255,255,0.05)" },
              },
            }}
          >
            {(["all", "available", "taken"] as Availability[]).map((a) => (
              <ToggleButton key={a} value={a} aria-label={`${a === "all" ? "All" : a === "available" ? "Available" : "Taken"}, ${counts[a]} domains`}>
                {a === "available" && <Box component="span" sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: "success.main" }} />}
                {a === "taken" && <Box component="span" sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: "text.disabled" }} />}
                {a === "all" ? "All" : a === "available" ? "Available" : "Taken"}
                <Box component="span" sx={{ fontFamily: "mono", fontSize: "0.6875rem", color: "text.disabled", fontVariantNumeric: "tabular-nums" }}>
                  {counts[a]}
                </Box>
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <HelpTip label="the availability filter" title="Availability">
            {AVAILABILITY_HELP[availability]}
          </HelpTip>
        </Box>

        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0.75 }}>
          <Typography variant="overline" sx={{ color: "text.disabled", mr: 0.5 }}>
            Extension
          </Typography>
          {FILTERS.map((f) => (
            <Box key={f.key} sx={{ display: "inline-flex", alignItems: "center" }}>
              <Chip
                label={f.label}
                size="small"
                variant={filter === f.key ? "filled" : "outlined"}
                onClick={() => setFilter(f.key)}
                aria-pressed={filter === f.key}
                sx={
                  filter === f.key
                    ? { bgcolor: "rgba(124,92,255,0.14)", color: "primary.light", border: "1px solid rgba(124,92,255,0.5)" }
                    : { color: "text.secondary" }
                }
              />
              <HelpTip label={`the ${f.label} filter`} title={f.label}>
                {f.help}
              </HelpTip>
            </Box>
          ))}
        </Box>
      </Box>

      {state.domainsError && <ErrorState description={state.domainsError} onRetry={loadDomains} />}

      {!state.domainsError && state.domainsLoading && (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr" }, gridAutoRows: "1fr", gap: 3, pt: 1.5 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <DomainCardSkeleton key={i} />
          ))}
        </Box>
      )}

      {!state.domainsError && !state.domainsLoading && filtered.length === 0 && (
        <EmptyState
          title={availability === "available" ? "Nothing available in this group" : availability === "taken" ? "Nothing taken in this group" : "No domains match this filter"}
          description="Try a different extension or availability filter, or go back and pick another brand."
        />
      )}

      {!state.domainsError && !state.domainsLoading && filtered.length > 0 && (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr" }, gridAutoRows: "1fr", gap: 3, pt: 1.5, pb: compare.length > 0 ? 12 : 0 }}>
          {filtered.map((item, i) => (
            <Box
              key={item.domainName}
              className="stagger-item"
              sx={{ height: "100%" }}
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
