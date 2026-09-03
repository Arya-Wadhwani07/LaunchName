"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import LanguageOutlinedIcon from "@mui/icons-material/LanguageOutlined";
import HubOutlinedIcon from "@mui/icons-material/HubOutlined";
import TravelExploreOutlinedIcon from "@mui/icons-material/TravelExploreOutlined";
import DnsOutlinedIcon from "@mui/icons-material/DnsOutlined";
import RocketLaunchOutlinedIcon from "@mui/icons-material/RocketLaunchOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
import { Badge, Button, Select, Option, Card } from "@/components/ui/primitives";
import { Table, THead, Th, Td, Tr, StatusIndicator, Skeleton, CountUp } from "@/components/ui/data";
import { EmptyState, ErrorState } from "@/components/ui/status";
import { PoweredByBadge } from "@/components/domain/PoweredBy";
import { DebugDrawer } from "@/components/domain/DebugDrawer";
import { DnsManager } from "@/features/dns/DnsManager";
import { AgentDirectory } from "@/features/agents/AgentDirectory";
import type { Domain } from "@/lib/namecom/types";
import type { LaunchRecord } from "@/lib/store";
import type { AgentDiscoveryRecord } from "@/lib/agents/types";

type Tab = "overview" | "domains" | "agents" | "directory" | "dns" | "launches" | "settings";

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "overview", label: "Overview", icon: <DashboardOutlinedIcon fontSize="small" /> },
  { key: "domains", label: "Domains", icon: <LanguageOutlinedIcon fontSize="small" /> },
  { key: "agents", label: "Agents", icon: <HubOutlinedIcon fontSize="small" /> },
  { key: "directory", label: "Agent Directory", icon: <TravelExploreOutlinedIcon fontSize="small" /> },
  { key: "dns", label: "DNS", icon: <DnsOutlinedIcon fontSize="small" /> },
  { key: "launches", label: "Activity", icon: <RocketLaunchOutlinedIcon fontSize="small" /> },
];

const SIDEBAR_WIDTH = 244;

interface EnrichedDomain extends Domain {
  launch: LaunchRecord | null;
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

export function Dashboard() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>((searchParams.get("tab") as Tab) || "overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [domains, setDomains] = useState<EnrichedDomain[] | null>(null);
  const [domainsError, setDomainsError] = useState<string | null>(null);
  const [launches, setLaunches] = useState<LaunchRecord[] | null>(null);
  const [agents, setAgents] = useState<AgentDiscoveryRecord[] | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string>(searchParams.get("domain") || "");
  const [debugOpen, setDebugOpen] = useState(false);
  const [providerMode, setProviderMode] = useState<{ mode: string; environment: string; baseUrl: string } | null>(null);

  useEffect(() => {
    loadDomains();
    loadLaunches();
    loadAgents();
    fetch("/api/debug/status")
      .then((r) => r.json())
      .then((d) => setProviderMode(d.provider));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadDomains() {
    setDomainsError(null);
    try {
      const res = await fetch("/api/domains/list");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? "Couldn't load domains.");
      setDomains(data.domains);
      setSelectedDomain((current) => current || data.domains[0]?.domainName || "");
    } catch (err) {
      setDomainsError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  async function loadLaunches() {
    const res = await fetch("/api/launch/list");
    const data = await res.json();
    setLaunches(data.launches ?? []);
  }

  async function loadAgents() {
    const res = await fetch("/api/agents/list");
    const data = await res.json();
    setAgents(data.agents ?? []);
  }

  const liveCount = launches?.filter((l) => l.status === "live").length ?? 0;
  const dnsConfiguredCount = launches?.filter((l) => l.status !== "domain_registered").length ?? 0;
  const verifiedAgentCount = agents?.filter((a) => a.status === "verified").length ?? 0;
  const discoverableAgentCount = agents?.filter((a) => a.status !== "draft").length ?? 0;
  const currentTab = TABS.find((t) => t.key === tab);

  const sidebarContent = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Box component={Link} href="/" sx={{ display: "flex", alignItems: "center", gap: 1, height: 56, px: 2.5, borderBottom: 1, borderColor: "divider", textDecoration: "none", flexShrink: 0 }}>
        <Box sx={{ width: 20, height: 20, borderRadius: 0.75, background: "linear-gradient(135deg, #7c5cff, #5b3fd6)" }} />
        <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>
          LaunchName
        </Typography>
      </Box>
      <Box component="nav" sx={{ display: "flex", flexDirection: "column", gap: 0.25, p: 1.5, flex: 1 }}>
        {TABS.map((t) => (
          <Box
            key={t.key}
            component="button"
            onClick={() => {
              setTab(t.key);
              setMobileOpen(false);
            }}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.25,
              borderRadius: 1.5,
              px: 1.5,
              py: 1,
              border: "none",
              cursor: "pointer",
              textAlign: "left",
              fontSize: "0.8125rem",
              fontFamily: "inherit",
              transition: "background-color 150ms ease, color 150ms ease",
              backgroundColor: tab === t.key ? "action.selected" : "transparent",
              color: tab === t.key ? "text.primary" : "text.secondary",
              "&:hover": { backgroundColor: "action.hover", color: "text.primary" },
            }}
          >
            <Box sx={{ display: "flex", color: tab === t.key ? "primary.light" : "inherit" }}>{t.icon}</Box>
            {t.label}
          </Box>
        ))}
        <Box
          component="button"
          onClick={() => {
            setTab("settings");
            setMobileOpen(false);
          }}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.25,
            borderRadius: 1.5,
            px: 1.5,
            py: 1,
            mt: "auto",
            border: "none",
            cursor: "pointer",
            textAlign: "left",
            fontSize: "0.8125rem",
            fontFamily: "inherit",
            backgroundColor: tab === "settings" ? "action.selected" : "transparent",
            color: tab === "settings" ? "text.primary" : "text.secondary",
            "&:hover": { backgroundColor: "action.hover", color: "text.primary" },
          }}
        >
          <SettingsOutlinedIcon fontSize="small" />
          Settings
        </Box>
      </Box>
      <Box sx={{ p: 2 }}>
        <PoweredByBadge />
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Drawer
        variant="permanent"
        sx={{ display: { xs: "none", sm: "block" }, width: SIDEBAR_WIDTH, flexShrink: 0, "& .MuiDrawer-paper": { width: SIDEBAR_WIDTH, boxSizing: "border-box", borderRight: 1, borderColor: "divider", backgroundColor: "rgba(18,18,24,0.5)" } }}
      >
        {sidebarContent}
      </Drawer>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        sx={{ display: { xs: "block", sm: "none" }, "& .MuiDrawer-paper": { width: SIDEBAR_WIDTH } }}
      >
        {sidebarContent}
      </Drawer>

      <Box component="main" sx={{ flex: 1, minWidth: 0, px: { xs: 2.5, sm: 5 }, py: { xs: 3, sm: 4 } }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 4, gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton onClick={() => setMobileOpen(true)} sx={{ display: { xs: "inline-flex", sm: "none" } }} aria-label="Open navigation">
              <MenuIcon />
            </IconButton>
            <Typography variant="h4">{currentTab?.label ?? "Overview"}</Typography>
          </Box>
          <Button size="sm" variant="ghost" startIcon={<BoltOutlinedIcon fontSize="small" />} onClick={() => setDebugOpen(true)}>
            API activity
          </Button>
        </Box>

        {tab === "overview" && (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", lg: "repeat(4, 1fr)" }, gap: 2.5 }}>
            <StatCard label="Active domains" value={domains ? String(domains.length) : "—"} />
            <StatCard label="Upcoming renewals" value={domains ? String(domains.filter((d) => isRenewingSoon(d.expireDate)).length) : "—"} />
            <StatCard label="DNS configured" value={launches ? String(dnsConfiguredCount) : "—"} />
            <StatCard label="Live launches" value={launches ? String(liveCount) : "—"} />
            <StatCard label="Agents" value={agents ? String(agents.length) : "—"} />
            <StatCard label="Verified agents" value={agents ? String(verifiedAgentCount) : "—"} />
            <StatCard label="Discoverable agents" value={agents ? String(discoverableAgentCount) : "—"} />
            <StatCard label="Agent connections" value="—" hint="Tracked per session in Agent Connect" />
            {providerMode && (
              <Card sx={{ gridColumn: { xs: "1 / -1", lg: "1 / -1" }, p: 2.5 }}>
                <Typography variant="overline" sx={{ display: "block", mb: 1 }}>
                  Provider
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}>
                  <Badge variant={providerMode.mode === "live" ? "available" : "premium"}>{providerMode.mode === "live" ? "Live name.com API" : "Mock mode"}</Badge>
                  <Badge variant="neutral">{providerMode.environment}</Badge>
                  <Typography variant="mono" sx={{ fontSize: "0.75rem", color: "text.disabled" }}>
                    {providerMode.baseUrl}
                  </Typography>
                </Box>
              </Card>
            )}
          </Box>
        )}

        {tab === "domains" && (
          <>
            {domainsError && <ErrorState description={domainsError} onRetry={loadDomains} />}
            {!domainsError && !domains && <Skeleton className="h-64 w-full" />}
            {!domainsError && domains && domains.length === 0 && (
              <EmptyState title="No domains yet" description="Launch your first idea to register a domain through name.com." action={<Link href="/"><Button size="sm">Start a launch</Button></Link>} />
            )}
            {!domainsError && domains && domains.length > 0 && (
              <Table>
                <THead>
                  <Th>Domain</Th>
                  <Th>Status</Th>
                  <Th>Renewal</Th>
                  <Th>DNS</Th>
                  <Th />
                </THead>
                <tbody>
                  {domains.map((d) => (
                    <Tr key={d.domainName}>
                      <Td className="font-mono">{d.domainName}</Td>
                      <Td>
                        <span className="inline-flex items-center gap-1.5">
                          <StatusIndicator status={d.locked ? "live" : "idle"} />
                          {d.locked ? "Registered" : "Unlocked"}
                        </span>
                      </Td>
                      <Td className="text-ink-muted">{formatDate(d.expireDate)}</Td>
                      <Td>
                        <Badge variant={d.launch && d.launch.status !== "domain_registered" ? "available" : "neutral"}>
                          {d.launch && d.launch.status !== "domain_registered" ? "Active" : "Pending"}
                        </Badge>
                      </Td>
                      <Td>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setSelectedDomain(d.domainName);
                            setTab("dns");
                          }}
                        >
                          Configure DNS
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            )}
          </>
        )}

        {tab === "agents" && (
          <>
            {!agents && <Skeleton className="h-64 w-full" />}
            {agents && agents.length === 0 && (
              <EmptyState
                title="No agents yet"
                description="Enable an agent identity next time you launch a domain, or add one to an existing domain."
                action={<Link href="/"><Button size="sm">Start a launch</Button></Link>}
              />
            )}
            {agents && agents.length > 0 && (
              <Table>
                <THead>
                  <Th>Agent</Th>
                  <Th>Host</Th>
                  <Th>Capabilities</Th>
                  <Th>Status</Th>
                  <Th>Discoverable</Th>
                  <Th />
                </THead>
                <tbody>
                  {agents.map((a) => (
                    <Tr key={a.id}>
                      <Td>{a.name}</Td>
                      <Td className="font-mono">{a.host}</Td>
                      <Td className="text-ink-muted">{a.capabilities.length}</Td>
                      <Td>
                        <Badge variant={a.status === "verified" ? "available" : "neutral"}>{a.status}</Badge>
                      </Td>
                      <Td>
                        <StatusIndicator status={a.status !== "draft" ? "live" : "idle"} />
                      </Td>
                      <Td>
                        <Link href={`/agents/${a.host}`}>
                          <Button size="sm" variant="secondary">
                            View
                          </Button>
                        </Link>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            )}
          </>
        )}

        {tab === "directory" && <AgentDirectory />}

        {tab === "dns" && (
          <Box>
            {domains && domains.length > 0 ? (
              <>
                <Box sx={{ mb: 3, maxWidth: 320 }}>
                  <Select label="Domain" value={selectedDomain} onChange={(e) => setSelectedDomain(e.target.value)}>
                    {domains.map((d) => (
                      <Option key={d.domainName} value={d.domainName}>
                        {d.domainName}
                      </Option>
                    ))}
                  </Select>
                </Box>
                {selectedDomain && <DnsManager domainName={selectedDomain} />}
              </>
            ) : (
              <EmptyState title="No domains to manage yet" description="Register a domain first to configure its DNS here." />
            )}
          </Box>
        )}

        {tab === "launches" && (
          <>
            {!launches && <Skeleton className="h-64 w-full" />}
            {launches && launches.length === 0 && <EmptyState title="No activity yet" description="Finish the launch flow to see it appear here." />}
            {launches && launches.length > 0 && (
              <Table>
                <THead>
                  <Th>Brand</Th>
                  <Th>Domain</Th>
                  <Th>Idea</Th>
                  <Th>Status</Th>
                  <Th>Registered</Th>
                </THead>
                <tbody>
                  {launches.map((l) => (
                    <Tr key={l.id}>
                      <Td>{l.brandName}</Td>
                      <Td className="font-mono">{l.domainName}</Td>
                      <Td className="max-w-[240px] truncate text-ink-muted" title={l.idea}>
                        {l.idea}
                      </Td>
                      <Td>
                        <Badge variant={l.status === "live" ? "available" : l.status === "dns_configured" ? "accent" : "neutral"}>
                          {l.status.replace("_", " ")}
                        </Badge>
                      </Td>
                      <Td className="text-ink-muted">{formatDate(l.registeredAt)}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            )}
          </>
        )}

        {tab === "settings" && (
          <Card sx={{ maxWidth: 480, p: 3 }}>
            <Typography variant="body2" sx={{ mb: 2.5 }}>
              Credentials and environment are configured server-side via environment variables, never editable from this dashboard.
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {[
                ["Mode", providerMode?.mode ?? "—"],
                ["Environment", providerMode?.environment ?? "—"],
              ].map(([k, v]) => (
                <Box key={k} sx={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
                  <Typography variant="body2" component="span">
                    {k}
                  </Typography>
                  <Typography variant="body2" component="span" sx={{ color: "text.primary" }}>
                    {v}
                  </Typography>
                </Box>
              ))}
              <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
                <Typography variant="body2" component="span">
                  API base URL
                </Typography>
                <Typography variant="mono" component="span" sx={{ fontSize: "0.75rem", color: "text.primary" }}>
                  {providerMode?.baseUrl ?? "—"}
                </Typography>
              </Box>
            </Box>
          </Card>
        )}
      </Box>

      <DebugDrawer open={debugOpen} onClose={() => setDebugOpen(false)} />
    </Box>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card sx={{ p: 2.5 }}>
      <Typography variant="overline" sx={{ display: "block" }}>
        {label}
      </Typography>
      <Typography variant="h3" sx={{ mt: 0.75, color: "text.primary" }}>
        <CountUp value={value} />
      </Typography>
      {hint && (
        <Typography variant="caption" component="div" sx={{ mt: 0.5 }}>
          {hint}
        </Typography>
      )}
    </Card>
  );
}

function isRenewingSoon(expireDate?: string) {
  if (!expireDate) return false;
  const days = (new Date(expireDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return days > 0 && days < 60;
}
