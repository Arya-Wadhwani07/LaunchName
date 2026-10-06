"use client";

import { useState } from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useLaunch } from "@/context/LaunchContext";
import { LaunchChecklist } from "@/components/domain/LaunchChecklist";
import { ActivityStream } from "@/components/domain/ActivityStream";
import { DebugDrawer } from "@/components/domain/DebugDrawer";
import { PoweredByBadge } from "@/components/domain/PoweredBy";
import { VerificationBadges } from "@/components/agent/VerificationBadges";
import { CapabilityChip } from "@/components/agent/CapabilityChip";
import { SuccessReveal } from "@/components/effects/SuccessReveal";
import { Button, Badge, Card } from "@/components/ui/primitives";
import { DnsManager } from "@/features/dns/DnsManager";
import { ArrowRightIcon } from "@phosphor-icons/react";

export function LaunchCenterStep() {
  const { state } = useLaunch();
  const [debugOpen, setDebugOpen] = useState(false);
  const launch = state.launch;
  const agent = state.agentEnabled ? state.agent : null;

  if (!launch) return null;

  return (
    <Box sx={{ maxWidth: 780, mx: "auto", px: 3, py: 8 }}>
      <Box sx={{ textAlign: "center", mb: 6 }}>
        <Box className="animate-scale-in" sx={{ mb: 2.5 }}>
          <SuccessReveal />
        </Box>
        <Box className="animate-fade-up" sx={{ animationDelay: "80ms", display: "flex", justifyContent: "center", gap: 1, mb: 1.5 }}>
          <Badge variant="available">Live · Registered</Badge>
          {agent && (
            <Badge variant={agent.status === "verified" ? "available" : "accent"}>
              {agent.status === "verified" ? "Agent verified" : "Agent discoverable"}
            </Badge>
          )}
        </Box>
        <Typography variant="h1" className="animate-fade-up text-balance" sx={{ animationDelay: "140ms", fontSize: { xs: "1.75rem", sm: "2.25rem" } }}>
          {launch.brandName} is officially yours.
        </Typography>
        <Typography variant="mono" className="animate-fade-up" sx={{ animationDelay: "200ms", display: "block", mt: 1.5, fontSize: "1.125rem", color: "primary.light" }}>
          {launch.domainName}
        </Typography>
        {agent && (
          <Typography variant="body2" className="animate-fade-up" sx={{ animationDelay: "240ms", mt: 1, maxWidth: 420, mx: "auto" }}>
            Now it&apos;s also where <Box component="span" sx={{ color: "text.primary" }}>{agent.name}</Box> can be discovered.
          </Typography>
        )}
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2.5 }}>
        <Card sx={{ p: 3 }}>
          <Typography variant="overline" sx={{ display: "block", mb: 2 }}>
            Launch checklist
          </Typography>
          <LaunchChecklist
            items={[
              { label: "Domain registered", done: true },
              { label: "Domain secured", done: true },
              { label: "DNS configured", done: launch.status !== "domain_registered" },
              ...(agent
                ? [
                    { label: "Agent identity created", done: Boolean(agent) },
                    { label: "Capabilities declared", done: agent.capabilities.length > 0 },
                    { label: "Endpoint configured", done: agent.verification.gatewayConfigured },
                    { label: "Domain ownership verified", done: agent.verification.domainOwnershipVerified },
                    { label: "Agent discovery enabled", done: agent.status !== "draft" },
                  ]
                : []),
              { label: "Landing page ready", done: launch.status === "live" },
              { label: "Launch configuration complete", done: launch.status === "live" },
            ]}
          />
        </Card>
        <Card sx={{ p: 3 }}>
          <Typography variant="overline" sx={{ display: "block", mb: 2 }}>
            Activity
          </Typography>
          <ActivityStream events={state.activity} />
        </Card>
      </Box>

      {agent && (
        <Card sx={{ mt: 2.5, p: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="overline">Agent identity</Typography>
            <Box component={Link} href={`/agents/${agent.host}`} sx={{ fontSize: "0.75rem", color: "primary.light", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
              View full profile →
            </Box>
          </Box>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 2 }}>
            {agent.capabilities.map((c) => (
              <CapabilityChip key={c.id} label={c.label} />
            ))}
          </Box>
          <VerificationBadges verification={agent.verification} />
        </Card>
      )}

      <Card sx={{ mt: 2.5, p: 3 }}>
        <Typography variant="overline" sx={{ display: "block", mb: 2 }}>
          Launch DNS
        </Typography>
        <DnsManager domainName={launch.domainName} />
      </Card>

      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 1.5, mt: 5 }}>
        <Link href={`/site/${launch.slug}`} target="_blank">
          <Button size="lg" endIcon={<ArrowRightIcon size={20} aria-hidden />}>
            Open your site
          </Button>
        </Link>
        {agent && (
          <Link href={`/agents/${agent.host}/connect`}>
            <Button size="lg" endIcon={<ArrowRightIcon size={20} aria-hidden />}>
              Talk to your agent
            </Button>
          </Link>
        )}
        <Link href="/dashboard">
          <Button size="lg" variant="secondary">
            Go to dashboard
          </Button>
        </Link>
        <Button size="lg" variant="ghost" onClick={() => setDebugOpen(true)}>
          View API activity
        </Button>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
        <PoweredByBadge />
      </Box>

      <DebugDrawer open={debugOpen} onClose={() => setDebugOpen(false)} />
    </Box>
  );
}
