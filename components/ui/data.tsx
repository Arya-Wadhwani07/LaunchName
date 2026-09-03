"use client";

import { useEffect, useRef, useState } from "react";
import MuiTable from "@mui/material/Table";
import MuiTableHead from "@mui/material/TableHead";
import MuiTableRow from "@mui/material/TableRow";
import MuiTableCell from "@mui/material/TableCell";
import MuiSkeleton from "@mui/material/Skeleton";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { keyframes } from "@mui/material/styles";

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Box className={`scrollbar-thin ${className ?? ""}`} sx={{ overflowX: "auto", borderRadius: 2, border: 1, borderColor: "divider" }}>
      <MuiTable sx={{ minWidth: 560 }} size="small">
        {children}
      </MuiTable>
    </Box>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return (
    <MuiTableHead>
      <MuiTableRow>{children}</MuiTableRow>
    </MuiTableHead>
  );
}

export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <MuiTableCell className={className}>{children}</MuiTableCell>;
}

export function Td({ children, className, title }: { children?: React.ReactNode; className?: string; title?: string }) {
  return (
    <MuiTableCell className={className} title={title}>
      {children}
    </MuiTableCell>
  );
}

export function Tr({ children, className }: { children: React.ReactNode; className?: string }) {
  return <MuiTableRow className={className}>{children}</MuiTableRow>;
}

export function Skeleton({ className }: { className?: string }) {
  // Sizing comes entirely from the Tailwind h-*/w-* classes callers pass in
  // className (there are ~15 call sites across the app already written
  // that way) — MUI's own width/height props are left untouched so they
  // never fight that.
  return <MuiSkeleton className={className} variant="rounded" animation="wave" />;
}

export type StepState = "pending" | "active" | "done" | "error";

const pulseRing = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(124,92,255,0.35); }
  100% { box-shadow: 0 0 0 8px rgba(124,92,255,0); }
`;

export function ProgressStep({
  label,
  state,
  detail,
}: {
  label: string;
  state: StepState;
  detail?: string;
}) {
  const palette: Record<StepState, { border: string; bg: string; fg: string }> = {
    done: { border: "rgba(61,220,151,0.4)", bg: "rgba(61,220,151,0.1)", fg: "success.main" },
    active: { border: "rgba(124,92,255,0.5)", bg: "rgba(124,92,255,0.1)", fg: "primary.light" },
    pending: { border: "divider", bg: "transparent", fg: "text.disabled" },
    error: { border: "rgba(255,107,107,0.4)", bg: "rgba(255,107,107,0.1)", fg: "error.main" },
  };
  const p = palette[state];
  return (
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
      <Box
        sx={{
          mt: 0.25,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 20,
          height: 20,
          flexShrink: 0,
          borderRadius: "50%",
          border: 1,
          borderColor: p.border,
          bgcolor: p.bg,
          color: p.fg,
          fontSize: 11,
          animation: state === "active" ? `${pulseRing} 1.4s cubic-bezier(0.4,0,0.6,1) infinite` : undefined,
        }}
      >
        {state === "done" && "✓"}
        {state === "error" && "!"}
        {state === "active" && <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "primary.light" }} />}
        {state === "pending" && <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "text.disabled" }} />}
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          variant="body1"
          sx={{
            color: state === "pending" ? "text.disabled" : "text.primary",
            fontWeight: state === "active" ? 500 : 400,
          }}
        >
          {label}
        </Typography>
        {detail && (
          <Typography variant="caption" component="div" sx={{ mt: 0.25 }}>
            {detail}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

export function StatusIndicator({ status }: { status: "live" | "pending" | "error" | "idle" }) {
  const colors = { live: "success.main", pending: "warning.main", error: "error.main", idle: "text.disabled" } as const;
  return (
    <Box
      component="span"
      sx={{
        display: "inline-block",
        width: 6,
        height: 6,
        borderRadius: "50%",
        bgcolor: colors[status],
        animation: status === "pending" ? "pulse 1.5s ease-in-out infinite" : undefined,
        "@keyframes pulse": { "0%, 100%": { opacity: 1 }, "50%": { opacity: 0.4 } },
      }}
    />
  );
}

/**
 * Animates from 0 (or the previous value) up to `value` whenever it
 * changes — used for dashboard stat tiles so a number landing feels like
 * an event, not just text that appeared. Non-numeric values (e.g. "—"
 * while loading) render as-is, no animation.
 */
export function CountUp({ value, durationMs = 700 }: { value: string; durationMs?: number }) {
  const numeric = Number(value);
  const isNumeric = value.trim() !== "" && Number.isFinite(numeric);
  const [display, setDisplay] = useState(isNumeric ? 0 : value);
  const prevTarget = useRef<number | null>(null);

  useEffect(() => {
    if (!isNumeric) {
      setDisplay(value);
      return;
    }
    const from = prevTarget.current ?? 0;
    prevTarget.current = numeric;
    if (from === numeric) {
      setDisplay(numeric);
      return;
    }
    const start = performance.now();
    let frame: number;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (numeric - from) * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span>{display}</span>;
}
