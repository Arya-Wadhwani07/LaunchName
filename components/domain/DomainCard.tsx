"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import LinearProgress from "@mui/material/LinearProgress";
import CheckCircleIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import { Badge, Button, Card } from "@/components/ui/primitives";
import { Skeleton } from "@/components/ui/data";
import type { SearchResult } from "@/lib/namecom/types";

export interface DomainResultItem extends SearchResult {
  categories?: string[];
  errorMessage?: string;
  humanScore?: number;
  humanReasons?: string[];
  agentScore?: number;
  agentReasons?: string[];
}

function StatusBadge({ item }: { item: DomainResultItem }) {
  if (item.errorMessage) return <Badge variant="error">Error</Badge>;
  if (!item.purchasable) return <Badge variant="taken">Taken</Badge>;
  if (item.premium) return <Badge variant="premium">Premium</Badge>;
  return <Badge variant="available">● Available</Badge>;
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
      <Typography variant="caption" sx={{ width: 96, flexShrink: 0 }}>
        {label}
      </Typography>
      <LinearProgress
        variant="determinate"
        value={score}
        sx={{
          flex: 1,
          "& .MuiLinearProgress-bar": {
            background: score >= 85 ? "linear-gradient(90deg, #7c5cff, #ff5cad)" : undefined,
          },
        }}
      />
      <Typography variant="caption" sx={{ width: 20, flexShrink: 0, textAlign: "right", color: "text.secondary" }}>
        {score}
      </Typography>
    </Box>
  );
}

export function DomainCard({
  item,
  isBestPick,
  isBestAgentPick,
  agentMode,
  selected,
  onSelect,
  selectLabel = "Secure domain",
  compareAction,
}: {
  item: DomainResultItem;
  isBestPick?: boolean;
  isBestAgentPick?: boolean;
  agentMode?: boolean;
  selected?: boolean;
  onSelect?: (item: DomainResultItem) => void;
  selectLabel?: string;
  compareAction?: React.ReactNode;
}) {
  const [sld, ...tldParts] = item.domainName.split(".");
  const tld = tldParts.join(".");
  const reasons =
    agentMode && item.purchasable && !item.errorMessage
      ? Array.from(new Set([...(item.agentReasons ?? []), ...(item.humanReasons ?? [])])).slice(0, 3)
      : [];
  const isTaken = !item.purchasable && !item.errorMessage;

  return (
    <Card
      sx={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
        p: 2.25,
        opacity: isTaken ? 0.55 : 1,
        ...(selected && { borderColor: "primary.main", boxShadow: (t) => `0 0 0 1px ${t.palette.primary.main}, ${t.shadows[3]}` }),
      }}
      interactive={item.purchasable && !item.errorMessage && !selected}
    >
      {(isBestPick || isBestAgentPick) && (
        <Box
          sx={{
            position: "absolute",
            top: -11,
            left: 16,
            borderRadius: 999,
            px: 1,
            py: 0.25,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            color: isBestAgentPick ? "#fff" : "background.default",
            backgroundColor: isBestAgentPick ? "primary.main" : "text.primary",
          }}
        >
          {isBestAgentPick ? "Best agent pick" : "Best pick"}
        </Box>
      )}

      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
        <Typography variant="mono" noWrap sx={{ fontSize: "1rem", color: "text.primary" }}>
          {sld}
          <Box component="span" sx={{ color: "text.disabled" }}>
            .{tld}
          </Box>
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexShrink: 0 }}>
          {compareAction}
          <StatusBadge item={item} />
        </Box>
      </Box>

      {agentMode && item.purchasable && !item.errorMessage && item.humanScore !== undefined && item.agentScore !== undefined && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, borderRadius: 1.5, backgroundColor: "background.default", p: 1.25 }}>
          <ScoreBar label="Human identity" score={item.humanScore} />
          <ScoreBar label="Agent readiness" score={item.agentScore} />
        </Box>
      )}

      {reasons.length > 0 && (
        <Box component="ul" sx={{ display: "flex", flexDirection: "column", gap: 0.5, m: 0, p: 0, listStyle: "none" }}>
          {reasons.map((r) => (
            <Box component="li" key={r} sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <CheckCircleIcon sx={{ fontSize: 13, color: "success.main" }} />
              <Typography variant="caption">{r}</Typography>
            </Box>
          ))}
        </Box>
      )}

      <Box sx={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", mt: "auto", pt: 0.5 }}>
        <Box>
          {item.errorMessage ? (
            <Typography variant="caption" sx={{ color: "error.main" }}>
              {item.errorMessage}
            </Typography>
          ) : item.purchasable ? (
            <>
              <Typography variant="h5" sx={{ color: "text.primary" }}>
                ${item.purchasePrice?.toFixed(2) ?? "—"}
              </Typography>
              <Typography variant="caption">
                /yr{item.renewalPrice && item.renewalPrice !== item.purchasePrice ? ` · renews $${item.renewalPrice.toFixed(2)}` : ""}
              </Typography>
            </>
          ) : (
            <Typography variant="caption">{item.reason ?? "Not available"}</Typography>
          )}
        </Box>
        {item.purchasable && !item.errorMessage && (
          <Button size="sm" variant={selected ? "primary" : "secondary"} onClick={() => onSelect?.(item)}>
            {selected ? "Selected" : selectLabel}
          </Button>
        )}
      </Box>
    </Card>
  );
}

export function DomainCardSkeleton() {
  return (
    <Card sx={{ display: "flex", flexDirection: "column", gap: 1.5, p: 2.25 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-16" />
      </Box>
      <Box sx={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <Skeleton className="h-6 w-14" />
        <Skeleton className="h-8 w-20" />
      </Box>
    </Card>
  );
}
