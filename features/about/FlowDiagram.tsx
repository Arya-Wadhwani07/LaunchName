"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import { Button } from "@/components/ui/primitives";

type Power = "name.com" | "Claude" | "LaunchName";

interface Stage {
  key: string;
  label: string;
  icon: string;
  power: Power;
  summary: string;
  detail: string;
}

const STAGES: Stage[] = [
  {
    key: "idea",
    label: "Idea",
    icon: "✦",
    power: "Claude",
    summary: "Describe what you're building, in a sentence.",
    detail:
      "One text box. No forms, no category pickers, just describe the idea the way you'd say it out loud. Everything downstream is derived from this sentence.",
  },
  {
    key: "brand",
    label: "Brand",
    icon: "◆",
    power: "Claude",
    summary: "AI drafts a handful of brandable names.",
    detail:
      "Claude proposes short, ownable names with a rationale for each: not a word-salad generator, a naming-agency-style pass with a story behind every option.",
  },
  {
    key: "domain",
    label: "Domain",
    icon: "◎",
    power: "name.com",
    summary: "Live availability and pricing, per candidate.",
    detail:
      "Every domain shown is a real name.com Core API call: checkAvailability and search, batched across a curated TLD set. Nothing here is guessed or cached from a static list.",
  },
  {
    key: "register",
    label: "Register",
    icon: "✓",
    power: "name.com",
    summary: "Secure the one you pick.",
    detail:
      "A real POST to name.com's Core API (with an idempotency key, and a fresh availability re-check first), run against name.com's sandbox in this build, production-ready by swapping one environment variable.",
  },
  {
    key: "dns",
    label: "DNS",
    icon: "▤",
    power: "name.com",
    summary: "Configure the infrastructure automatically.",
    detail:
      "A, CNAME, and TXT records created through the same Core API: read, written, edited, and deleted live, with server-side validation before anything is sent.",
  },
  {
    key: "agent",
    label: "Agent identity",
    icon: "◈",
    power: "LaunchName",
    summary: "Turn the domain into an agent, optionally.",
    detail:
      "Declare what the agent can do, and how it talks. LaunchName builds a structured manifest (name, capabilities, protocol, endpoint) bound to the domain you just secured.",
  },
  {
    key: "discovery",
    label: "Discovery",
    icon: "◉",
    power: "name.com",
    summary: "Publish and verify, through real DNS.",
    detail:
      "A discovery marker is written as a DNS TXT record via name.com, then read back to prove whoever controls this domain's DNS also published this agent: a real check, not a badge that just appears.",
  },
  {
    key: "communication",
    label: "Communication",
    icon: "⇄",
    power: "LaunchName",
    summary: "Agents discover and talk to each other.",
    detail:
      "A visible handshake (discover, identify, verify, connect) followed by a real Claude-generated reply in character as the agent. Demo and live paths are always labeled, never blurred together.",
  },
];

const POWER_SX: Record<Power, { color: string; borderColor: string; bgcolor: string }> = {
  "name.com": { color: "success.main", borderColor: "rgba(58,217,183,0.3)", bgcolor: "rgba(58,217,183,0.1)" },
  Claude: { color: "secondary.light", borderColor: "rgba(255,162,71,0.3)", bgcolor: "rgba(255,162,71,0.1)" },
  LaunchName: { color: "primary.light", borderColor: "rgba(124,92,255,0.3)", bgcolor: "rgba(124,92,255,0.1)" },
};

export function FlowDiagram() {
  const [active, setActive] = useState(0);
  const stage = STAGES[active];

  return (
    <Box>
      <Box className="scrollbar-thin" sx={{ overflowX: "auto", pb: 2 }}>
        <Box sx={{ display: "flex", minWidth: "max-content", alignItems: "center", gap: 0.5, px: 0.5 }}>
          {STAGES.map((s, i) => (
            <Box key={s.key} sx={{ display: "flex", alignItems: "center" }}>
              <Box
                component="button"
                onClick={() => setActive(i)}
                sx={{
                  display: "flex",
                  width: 132,
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 1,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: i === active ? "rgba(124,92,255,0.5)" : "divider",
                  bgcolor: i === active ? "rgba(124,92,255,0.1)" : "background.paper",
                  px: 1.5,
                  py: 2,
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all 200ms",
                  "&:hover": { borderColor: i === active ? "rgba(124,92,255,0.5)" : "rgba(255,255,255,0.15)" },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    height: 40,
                    width: 40,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%",
                    border: "1px solid",
                    borderColor: i === active ? "rgba(124,92,255,0.5)" : "divider",
                    bgcolor: i === active ? "rgba(124,92,255,0.2)" : "transparent",
                    color: i === active ? "primary.light" : "text.secondary",
                    fontSize: 18,
                  }}
                >
                  {s.icon}
                </Box>
                <Typography variant="caption" sx={{ fontWeight: 500, color: i === active ? "text.primary" : "text.secondary" }}>
                  {s.label}
                </Typography>
              </Box>
              {i < STAGES.length - 1 && (
                <Box sx={{ position: "relative", mx: 0.5, height: 1, width: 32, flexShrink: 0, overflow: "hidden", bgcolor: "divider" }}>
                  <Box
                    className={i < active ? "animate-flow-dash" : undefined}
                    sx={{
                      position: "absolute",
                      inset: 0,
                      backgroundSize: "16px 1px",
                      opacity: i < active ? 1 : 0,
                      transition: "opacity 500ms",
                      backgroundImage: "repeating-linear-gradient(90deg, #7c5cff 0 8px, transparent 8px 16px)",
                    }}
                  />
                </Box>
              )}
            </Box>
          ))}
        </Box>
      </Box>

      <Card key={stage.key} className="animate-fade-up" sx={{ mt: 3, p: { xs: 3, sm: 4 } }}>
        <Box sx={{ mb: 1.5, display: "flex", alignItems: "center", gap: 1.5 }}>
          <Chip
            label={`Powered by ${stage.power}`}
            size="small"
            sx={{
              textTransform: "uppercase",
              fontSize: "0.6875rem",
              letterSpacing: "0.04em",
              border: "1px solid",
              ...POWER_SX[stage.power],
            }}
          />
          <Typography variant="caption" sx={{ color: "text.disabled" }}>
            Step {active + 1} of {STAGES.length}
          </Typography>
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: "-0.01em" }}>
          {stage.label}
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5, color: "text.secondary" }}>
          {stage.summary}
        </Typography>
        <Typography variant="body2" sx={{ mt: 2, maxWidth: 640, lineHeight: 1.7, color: "text.disabled" }}>
          {stage.detail}
        </Typography>

        <Box sx={{ mt: 3, display: "flex", gap: 1 }}>
          <Button size="sm" variant="ghost" onClick={() => setActive((a) => Math.max(0, a - 1))} disabled={active === 0}>
            ← Previous
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setActive((a) => Math.min(STAGES.length - 1, a + 1))} disabled={active === STAGES.length - 1}>
            Next →
          </Button>
        </Box>
      </Card>
    </Box>
  );
}
