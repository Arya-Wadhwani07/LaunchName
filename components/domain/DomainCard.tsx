"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import LinearProgress from "@mui/material/LinearProgress";
import Card from "@mui/material/Card";
import { Badge, Button } from "@/components/ui/primitives";
import { Skeleton } from "@/components/ui/data";
import { HelpTip } from "@/components/ui/HelpTip";
import type { SearchResult } from "@/lib/namecom/types";
import { CheckCircleIcon } from "@phosphor-icons/react";

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

const SCORE_HELP: Record<string, string> = {
  "Human identity": "How brandable this domain is for people: short, easy to say and spell, and on a familiar extension. Higher is more memorable.",
  "Agent readiness": "How well this domain works as an AI agent's address: AI-native extensions like .ai or .dev, a clean name agents can resolve, and room for agent subdomains.",
};

function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
      <Box sx={{ width: 118, flexShrink: 0, display: "flex", alignItems: "center" }}>
        <Typography variant="caption">{label}</Typography>
        <HelpTip label={label} title={label}>
          {SCORE_HELP[label]}
        </HelpTip>
      </Box>
      <LinearProgress
        variant="determinate"
        value={score}
        aria-label={`${label} score ${score} out of 100`}
        sx={{
          flex: 1,
          "& .MuiLinearProgress-bar": {
            background: score >= 85 ? "linear-gradient(90deg, #7c5cff, #ffa247)" : undefined,
          },
        }}
      />
      <Typography variant="caption" sx={{ width: 22, flexShrink: 0, textAlign: "right", color: "text.secondary", fontVariantNumeric: "tabular-nums" }}>
        {score}
      </Typography>
    </Box>
  );
}

// Neumorphic depth on a dark ground: the card shares the background tone and
// gets its form from a dark drop shadow (bottom-right) plus a faint light
// highlight (top-left). Inner panels use the same pair inset so they read as
// pressed into the surface.
const NEU_RAISED = "9px 9px 20px rgba(0,0,0,0.62), -6px -6px 16px rgba(255,255,255,0.035)";
const NEU_RAISED_HOVER = "12px 12px 26px rgba(0,0,0,0.7), -8px -8px 20px rgba(255,255,255,0.045)";
const NEU_INSET = "inset 4px 4px 9px rgba(0,0,0,0.6), inset -3px -3px 8px rgba(255,255,255,0.035)";
const NEU_GROUND = "#111015";

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

  const isError = Boolean(item.errorMessage);
  const unavailable = isTaken || isError;

  return (
    <Card
      sx={{
        position: "relative",
        height: "100%",
        minHeight: agentMode ? 262 : 172,
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
        p: 2.5,
        borderRadius: 4,
        backgroundColor: NEU_GROUND,
        border: "1px solid rgba(255,255,255,0.04)",
        boxShadow: selected ? `${NEU_INSET}, 0 0 0 1.5px #7c5cff` : unavailable ? "none" : NEU_RAISED,
        transition: "box-shadow 220ms cubic-bezier(0.16,1,0.3,1), transform 220ms cubic-bezier(0.16,1,0.3,1)",
        ...(!unavailable &&
          !selected && {
            "&:hover": { boxShadow: NEU_RAISED_HOVER, transform: "translateY(-2px)" },
          }),
      }}
    >
      {(isBestPick || isBestAgentPick) && (
        <Box
          sx={{
            position: "absolute",
            top: -11,
            left: 18,
            borderRadius: 999,
            px: 1,
            py: 0.25,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            color: isBestAgentPick ? "#fff" : "background.default",
            backgroundColor: isBestAgentPick ? "primary.main" : "text.primary",
            boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
          }}
        >
          {isBestAgentPick ? "Best agent pick" : "Best pick"}
        </Box>
      )}

      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
        <Typography
          variant="mono"
          noWrap
          title={item.domainName}
          sx={{ fontSize: "1.0625rem", fontWeight: 500, color: unavailable ? "text.secondary" : "text.primary", minWidth: 0 }}
        >
          {sld}
          <Box component="span" sx={{ color: unavailable ? "text.disabled" : "primary.light" }}>
            .{tld}
          </Box>
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexShrink: 0 }}>
          {compareAction}
          <StatusBadge item={item} />
        </Box>
      </Box>

      {agentMode && !unavailable && item.humanScore !== undefined && item.agentScore !== undefined && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, borderRadius: 2.5, backgroundColor: NEU_GROUND, boxShadow: NEU_INSET, px: 1.5, py: 1.25 }}>
          <ScoreBar label="Human identity" score={item.humanScore} />
          <ScoreBar label="Agent readiness" score={item.agentScore} />
        </Box>
      )}

      {reasons.length > 0 && (
        <Box component="ul" sx={{ display: "flex", flexDirection: "column", gap: 0.5, m: 0, p: 0, listStyle: "none" }}>
          {reasons.map((r) => (
            <Box component="li" key={r} sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <Box component="span" sx={{ display: "inline-flex", color: "success.main" }}><CheckCircleIcon size={13} aria-hidden /></Box>
              <Typography variant="caption">{r}</Typography>
            </Box>
          ))}
        </Box>
      )}

      {unavailable && (
        <Box sx={{ flex: 1, display: "flex", alignItems: "center", borderRadius: 2.5, boxShadow: NEU_INSET, px: 1.75, py: 1.5 }}>
          <Typography variant="caption" sx={{ color: isError ? "error.main" : "text.secondary", lineHeight: 1.55 }}>
            {isError
              ? item.errorMessage
              : "Someone already owns this one. Try another extension of the same name, or filter to available domains only."}
          </Typography>
        </Box>
      )}

      <Box sx={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 1, mt: "auto", pt: 0.5 }}>
        <Box>
          {!unavailable ? (
            <>
              <Typography variant="h5" sx={{ color: "text.primary", fontVariantNumeric: "tabular-nums" }}>
                ${item.purchasePrice?.toFixed(2) ?? "—"}
              </Typography>
              <Typography variant="caption">
                /yr{item.renewalPrice && item.renewalPrice !== item.purchasePrice ? ` · renews $${item.renewalPrice.toFixed(2)}` : ""}
              </Typography>
            </>
          ) : (
            <Typography variant="caption" sx={{ color: "text.disabled" }}>
              {isError ? "Couldn't check" : "Not available"}
            </Typography>
          )}
        </Box>
        {!unavailable && (
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
    <Card sx={{ height: "100%", minHeight: 172, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 1.5, p: 2.5, borderRadius: 4, backgroundColor: NEU_GROUND, border: "1px solid rgba(255,255,255,0.04)", boxShadow: NEU_RAISED }}>
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
