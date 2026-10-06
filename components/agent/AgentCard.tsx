import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Badge, Card } from "@/components/ui/primitives";
import { CapabilityChip } from "./CapabilityChip";
import type { AgentDiscoveryRecord } from "@/lib/agents/types";
import { CircleIcon } from "@phosphor-icons/react/dist/ssr";

const CATEGORY_LABELS: Record<string, string> = {
  travel: "Travel",
  finance: "Finance",
  education: "Education",
  "developer-tools": "Developer Tools",
  commerce: "Commerce",
  productivity: "Productivity",
  research: "Research",
  "customer-support": "Customer Support",
  other: "Other",
};

export function AgentCard({ agent }: { agent: AgentDiscoveryRecord }) {
  return (
    <Card interactive sx={{ display: "flex", flexDirection: "column", gap: 2, p: 2.5 }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
        <Box sx={{ minWidth: 0, display: "flex", alignItems: "center", gap: 0.75 }}>
          <Box component="span" sx={{ display: "inline-flex", color: agent.status !== "draft" ? "success.main" : "text.disabled" }}><CircleIcon size={8} weight="fill" aria-hidden /></Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body1" noWrap sx={{ fontWeight: 600, color: "text.primary", fontSize: "0.9375rem" }}>
              {agent.name}
            </Typography>
            <Typography variant="mono" noWrap sx={{ fontSize: "0.6875rem", color: "text.disabled", display: "block" }}>
              {agent.host}
            </Typography>
          </Box>
        </Box>
        <Badge variant={agent.status === "verified" ? "available" : "neutral"}>
          {agent.status === "verified" ? "Verified domain" : agent.status === "published" ? "Published" : "Draft"}
        </Badge>
      </Box>

      <Typography
        variant="body2"
        sx={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
      >
        {agent.description}
      </Typography>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
        {agent.capabilities.slice(0, 3).map((c) => (
          <CapabilityChip key={c.id} label={c.label} />
        ))}
        {agent.capabilities.length > 3 && (
          <Typography variant="caption" sx={{ alignSelf: "center" }}>
            +{agent.capabilities.length - 3} more
          </Typography>
        )}
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: 1, borderColor: "divider", pt: 1.5 }}>
        <Typography variant="overline" sx={{ fontSize: "0.625rem" }}>
          {agent.protocols.join(" · ")}
        </Typography>
        <Typography variant="caption">{CATEGORY_LABELS[agent.category]}</Typography>
      </Box>

      <Box
        component={Link}
        href={`/agents/${agent.host}`}
        sx={{
          display: "block",
          borderRadius: 1.5,
          border: 1,
          borderColor: "divider",
          py: 1,
          textAlign: "center",
          fontSize: "0.8125rem",
          fontWeight: 500,
          color: "text.primary",
          textDecoration: "none",
          transition: "border-color 150ms ease, color 150ms ease",
          "&:hover": { borderColor: "rgba(124,92,255,0.4)", color: "primary.light" },
        }}
      >
        Talk to Agent
      </Box>
    </Card>
  );
}
