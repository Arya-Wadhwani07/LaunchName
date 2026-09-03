"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import SearchIcon from "@mui/icons-material/Search";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { AgentCard } from "@/components/agent/AgentCard";
import { AgentNetworkGraph } from "@/components/agent/AgentNetworkGraph";
import { Button, Card } from "@/components/ui/primitives";
import { EmptyState, ErrorState } from "@/components/ui/status";
import { Skeleton } from "@/components/ui/data";
import type { AgentCategory, AgentDiscoveryRecord, DomainAgentIndex } from "@/lib/agents/types";

const CATEGORIES: { key: AgentCategory | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "travel", label: "Travel" },
  { key: "finance", label: "Finance" },
  { key: "education", label: "Education" },
  { key: "developer-tools", label: "Developer Tools" },
  { key: "commerce", label: "Commerce" },
  { key: "productivity", label: "Productivity" },
  { key: "research", label: "Research" },
  { key: "customer-support", label: "Customer Support" },
];

export function AgentDirectory() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<AgentCategory | "all">("all");
  const [agents, setAgents] = useState<AgentDiscoveryRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [domainQuery, setDomainQuery] = useState("");
  const [domainIndex, setDomainIndex] = useState<DomainAgentIndex | null>(null);
  const [domainLoading, setDomainLoading] = useState(false);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  async function load(q?: string) {
    setError(null);
    try {
      const params = new URLSearchParams();
      const effectiveQuery = q ?? query;
      if (effectiveQuery.trim()) params.set("query", effectiveQuery.trim());
      if (category !== "all") params.set("category", category);
      const res = await fetch(`/api/agents/directory?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? "Couldn't load the agent directory.");
      setAgents(data.agents);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  async function lookupDomain() {
    const domain = domainQuery.trim().toLowerCase();
    if (!domain) return;
    setDomainLoading(true);
    setDomainIndex(null);
    try {
      const res = await fetch(`/api/agents/resolve/${encodeURIComponent(domain)}`);
      const data = await res.json();
      setDomainIndex(data.index);
    } finally {
      setDomainLoading(false);
    }
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <Box component="section">
        <Typography variant="overline" sx={{ display: "block", mb: 1 }}>
          Look up agents by domain
        </Typography>
        <Typography variant="body2" sx={{ maxWidth: 560, mb: 2 }}>
          Domains aren&apos;t just where a site lives, a domain can be the address book for its agents. Enter a
          domain LaunchName has published agents under to see what&apos;s discoverable there.
        </Typography>
        <Box sx={{ display: "flex", gap: 1, maxWidth: 420 }}>
          <TextField
            value={domainQuery}
            onChange={(e) => setDomainQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && lookupDomain()}
            placeholder="e.g. tripilot.ai"
            size="small"
            fullWidth
          />
          <Button onClick={lookupDomain} disabled={!domainQuery.trim() || domainLoading} sx={{ flexShrink: 0 }}>
            {domainLoading ? "Looking up…" : "Resolve"}
          </Button>
        </Box>

        {domainIndex && (
          <Card sx={{ mt: 3, p: 3 }}>
            {domainIndex.agentCount === 0 ? (
              <EmptyState
                title={`No agents found for ${domainIndex.rootDomain}`}
                description="This checks LaunchName's own registry, not the public internet at large. A domain only shows up here once someone has published an agent under it through LaunchName."
              />
            ) : (
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 3 }}>
                <Box>
                  <Typography variant="mono" sx={{ display: "block", fontSize: "0.875rem", color: "text.primary" }}>
                    {domainIndex.rootDomain}
                  </Typography>
                  <Typography variant="caption" component="div" sx={{ mb: 2 }}>
                    {domainIndex.agentCount} discoverable agent{domainIndex.agentCount === 1 ? "" : "s"} ·{" "}
                    {domainIndex.publicationPoints.length} publication point{domainIndex.publicationPoints.length === 1 ? "" : "s"}
                  </Typography>
                  <AgentNetworkGraph rootDomain={domainIndex.rootDomain} agents={domainIndex.agents} />
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                  {domainIndex.agents.map((a) => (
                    <Box
                      component={Link}
                      key={a.id}
                      href={`/agents/${a.host}`}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        borderRadius: 1.5,
                        border: 1,
                        borderColor: "divider",
                        backgroundColor: "background.default",
                        px: 2,
                        py: 1.5,
                        textDecoration: "none",
                        transition: "border-color 150ms ease",
                        "&:hover": { borderColor: "rgba(124,92,255,0.4)" },
                      }}
                    >
                      <Box>
                        <Typography variant="body2" sx={{ color: "text.primary" }}>
                          {a.name}
                        </Typography>
                        <Typography variant="mono" sx={{ fontSize: "0.6875rem", color: "text.disabled" }}>
                          {a.host}
                        </Typography>
                      </Box>
                      <ArrowForwardIcon sx={{ fontSize: 16, color: "primary.light" }} />
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Card>
        )}
      </Box>

      <Box component="section">
        <Typography variant="overline" sx={{ display: "block", mb: 1.5 }}>
          Browse the directory
        </Typography>
        <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1.5, mb: 2.5 }}>
          <TextField
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            placeholder="What can this agent help me with?"
            size="small"
            fullWidth
            slotProps={{ input: { startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: "text.disabled" }} /> } }}
          />
          <Button variant="secondary" onClick={() => load()} sx={{ flexShrink: 0 }}>
            Search
          </Button>
        </Box>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 3 }}>
          {CATEGORIES.map((c) => (
            <Chip
              key={c.key}
              label={c.label}
              size="small"
              variant="outlined"
              onClick={() => setCategory(c.key)}
              sx={
                category === c.key
                  ? { color: "primary.light", borderColor: "rgba(124,92,255,0.5)", backgroundColor: "rgba(124,92,255,0.1)" }
                  : { color: "text.secondary", borderColor: "divider" }
              }
            />
          ))}
        </Box>

        {error && <ErrorState description={error} onRetry={() => load()} />}

        {!error && !agents && (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(3, 1fr)" }, gap: 2 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </Box>
        )}

        {!error && agents && agents.length === 0 && (
          <EmptyState
            title="No agents published yet"
            description="Launch an idea with an agent identity to be the first one here."
            action={
              <Link href="/">
                <Button size="sm">Start a launch</Button>
              </Link>
            }
          />
        )}

        {!error && agents && agents.length > 0 && (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(3, 1fr)" }, gap: 2 }}>
            {agents.map((a, i) => (
              <Box key={a.id} className="stagger-item" style={{ "--stagger-index": i } as React.CSSProperties}>
                <AgentCard agent={a} />
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
