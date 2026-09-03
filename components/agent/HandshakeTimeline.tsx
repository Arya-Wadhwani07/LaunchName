"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CheckIcon from "@mui/icons-material/Check";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";
import type { HandshakeStepResult } from "@/lib/agents/types";

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return iso;
  }
}

/** Renders a handshake timeline with each step staggered in — the backend already ran these steps; this is just a legible reveal of real results, not a fake animation loop. */
export function HandshakeTimeline({ steps }: { steps: HandshakeStepResult[] }) {
  return (
    <Box component="ol" sx={{ display: "flex", flexDirection: "column", gap: 1.5, m: 0, p: 0, listStyle: "none" }}>
      {steps.map((step, i) => (
        <Box
          component="li"
          key={`${step.key}-${i}`}
          className="animate-fade-up"
          style={{ animationDelay: `${i * 90}ms` }}
          sx={{ display: "flex", gap: 1.5 }}
        >
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
              borderColor: step.status === "done" ? "rgba(61,220,151,0.4)" : "rgba(255,107,107,0.4)",
              backgroundColor: step.status === "done" ? "rgba(61,220,151,0.1)" : "rgba(255,107,107,0.1)",
              color: step.status === "done" ? "success.main" : "error.main",
            }}
          >
            {step.status === "done" ? <CheckIcon sx={{ fontSize: 12 }} /> : <PriorityHighIcon sx={{ fontSize: 12 }} />}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="mono" sx={{ fontSize: "0.6875rem", color: "text.disabled" }}>
                {formatTime(step.timestamp)}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.primary" }}>
                {step.label}
              </Typography>
            </Box>
            {step.detail && (
              <Typography variant="caption" component="div" noWrap sx={{ mt: 0.25, maxWidth: 480 }}>
                {step.detail}
              </Typography>
            )}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
