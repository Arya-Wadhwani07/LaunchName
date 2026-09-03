"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { Badge, Button, Card } from "@/components/ui/primitives";
import { CapabilityChip } from "@/components/agent/CapabilityChip";
import { VerificationBadges } from "@/components/agent/VerificationBadges";
import { ErrorState } from "@/components/ui/status";
import { Skeleton } from "@/components/ui/data";
import { Modal } from "@/components/ui/overlay";
import type { AgentDiscoveryRecord, AgentManifest } from "@/lib/agents/types";

export function AgentProfile({ host }: { host: string }) {
  const [agent, setAgent] = useState<AgentDiscoveryRecord | null>(null);
  const [manifest, setManifest] = useState<AgentManifest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manifestOpen, setManifestOpen] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [host]);

  async function load() {
    setError(null);
    try {
      const res = await fetch(`/api/agents/${encodeURIComponent(host)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? "No agent found for that host.");
      setAgent(data.agent);
      setManifest(data.manifest);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  async function reverify() {
    setVerifying(true);
    try {
      const res = await fetch("/api/agents/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ host }),
      });
      const data = await res.json();
      if (res.ok) setAgent(data.agent);
    } finally {
      setVerifying(false);
    }
  }

  if (error) return <ErrorState description={error} onRetry={load} />;
  if (!agent) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full" />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 900, mx: "auto" }}>
      <Box sx={{ textAlign: "center", mb: 5 }}>
        <Typography variant="h1" sx={{ fontSize: { xs: "1.75rem", sm: "2.25rem" } }}>
          {agent.name}
        </Typography>
        <Typography variant="mono" sx={{ display: "block", mt: 0.5, color: "primary.light", fontSize: "0.875rem" }}>
          {agent.host}
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "center", mt: 1.5 }}>
          <Badge variant={agent.status === "verified" ? "available" : "neutral"}>
            {agent.status === "verified" ? "● Verified agent" : agent.status === "published" ? "Published" : "Draft"}
          </Badge>
        </Box>
        <Typography variant="body1" sx={{ fontStyle: "italic", maxWidth: 440, mx: "auto", mt: 2 }}>
          &ldquo;{agent.description}&rdquo;
        </Typography>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.1fr 0.9fr" }, gap: 2.5, alignItems: "start" }}>
        {/* Left: identity + capabilities */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          <Card sx={{ p: 3 }}>
            <Typography variant="overline" sx={{ display: "block", mb: 1.5 }}>
              Capabilities
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
              {agent.capabilities.map((c) => (
                <CapabilityChip key={c.id} label={c.label} />
              ))}
            </Box>
          </Card>
          <Card sx={{ p: 3 }}>
            <Typography variant="overline" sx={{ display: "block", mb: 1 }}>
              Communication
            </Typography>
            <Typography variant="body1" sx={{ color: "text.primary" }}>
              {agent.protocols.join(", ").toUpperCase()}
            </Typography>
            <Typography variant="overline" sx={{ display: "block", mt: 2, mb: 0.5 }}>
              Endpoint
            </Typography>
            <Typography variant="mono" noWrap sx={{ display: "block", fontSize: "0.75rem", color: "text.secondary" }}>
              {agent.endpoint}
            </Typography>
            <Typography variant="overline" sx={{ display: "block", mt: 2, mb: 0.5 }}>
              Discovery
            </Typography>
            <Typography variant="body1" sx={{ color: "text.primary" }}>
              Domain-bound
            </Typography>
          </Card>
        </Box>

        {/* Right: live connection panel */}
        <Card sx={{ p: 3, position: { md: "sticky" }, top: { md: 88 } }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="overline">Verification</Typography>
            <Button size="sm" variant="ghost" onClick={reverify} disabled={verifying}>
              {verifying ? "Checking…" : "Re-check"}
            </Button>
          </Box>
          <VerificationBadges verification={agent.verification} />

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 3 }}>
            <Link href={`/agents/${agent.host}/connect`} style={{ width: "100%" }}>
              <Button size="lg" fullWidth endIcon={<ArrowForwardIcon />}>
                Connect to Agent
              </Button>
            </Link>
            <Link href={`/dashboard?tab=dns&domain=${agent.rootDomain}`} style={{ width: "100%" }}>
              <Button size="md" variant="secondary" fullWidth>
                View DNS
              </Button>
            </Link>
            <Button size="md" variant="secondary" fullWidth onClick={() => setManifestOpen(true)}>
              View Discovery Metadata
            </Button>
          </Box>
        </Card>
      </Box>

      <Modal open={manifestOpen} onClose={() => setManifestOpen(false)} title="Discovery metadata">
        <Typography variant="caption" component="p" sx={{ mb: 1.5 }}>
          LaunchName&apos;s manifest for this agent, served at its gateway path and pointed to by a TXT record on the
          domain. Not an official DNS-AID/ANS record; those specify SVCB + DANE, which name.com&apos;s API doesn&apos;t
          expose today.
        </Typography>
        <Box
          component="pre"
          className="scrollbar-thin"
          sx={{
            maxHeight: 256,
            overflow: "auto",
            borderRadius: 1.5,
            backgroundColor: "background.default",
            p: 1.5,
            fontFamily: "var(--font-mono)",
            fontSize: "0.6875rem",
            color: "text.secondary",
            m: 0,
          }}
        >
          {JSON.stringify(manifest, null, 2)}
        </Box>
      </Modal>
    </Box>
  );
}
