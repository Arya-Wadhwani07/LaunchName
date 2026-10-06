"use client";

import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import Card from "@mui/material/Card";
import TextField from "@mui/material/TextField";
import { useLaunch } from "@/context/LaunchContext";
import { Button, Input, Switch } from "@/components/ui/primitives";
import { CapabilityChip, CapabilityInput } from "@/components/agent/CapabilityChip";
import { Skeleton } from "@/components/ui/data";
import { HelpTip } from "@/components/ui/HelpTip";
import type { AgentProtocol } from "@/lib/agents/types";

// 8-pt rhythm (theme spacing unit is 4px): sections get 28px of air on each
// side and a hairline divider; fields inside are 20px apart so floating
// labels never crowd the field above.
const SECTION_SX = { display: "flex", flexDirection: "column", gap: 5, py: 7, borderTop: 1, borderColor: "divider" } as const;

const PROTOCOL_OPTIONS: { key: AgentProtocol; label: string; hint: string }[] = [
  { key: "https", label: "HTTPS", hint: "Ask a question, get one complete answer back. Works with almost anything." },
  { key: "streaming", label: "Streaming", hint: "Sends its answer piece by piece as it thinks, for long or live responses." },
  { key: "mcp", label: "MCP-compatible", hint: "Speaks the Model Context Protocol, so AI assistants can use it as a tool." },
];

export function AgentCapabilityStep({ onContinue }: { onContinue: () => void }) {
  const { state, dispatch } = useLaunch();
  const inFlight = useRef<string | null>(null);
  const [addValue, setAddValue] = useState("");

  // Skips the Claude call when this brand already has a profile, so coming
  // Back never overwrites capabilities the user edited.
  useEffect(() => {
    if (!state.agentEnabled || !state.selectedBrand) return;
    const brand = state.selectedBrand.name;
    if (state.agentProfileFor === brand || state.agentProfileLoading || inFlight.current === brand) return;
    inFlight.current = brand;
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.agentEnabled, state.selectedBrand, state.agentProfileFor]);

  async function loadProfile() {
    const brand = state.selectedBrand;
    if (!brand) return;
    dispatch({ type: "AGENT_PROFILE_LOADING" });
    try {
      const res = await fetch("/api/agents/brainstorm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: state.idea, agentName: state.agentName || brand.name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? "Couldn't draft an agent profile.");
      dispatch({
        type: "AGENT_PROFILE_SUCCESS",
        description: data.profile.description,
        category: data.profile.category,
        capabilities: data.profile.capabilities,
        forBrand: brand.name,
      });
    } catch (err) {
      dispatch({ type: "AGENT_PROFILE_ERROR", error: err instanceof Error ? err.message : "Something went wrong." });
    }
  }

  function addCapability() {
    const label = addValue.trim();
    if (!label) return;
    const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    // A label made entirely of symbols (e.g. "!!!") slugifies to "" — fall
    // back to a short random suffix so it never collides with (or silently
    // no-ops against) another capability's id.
    const id = slug || `capability-${Math.random().toString(36).slice(2, 8)}`;
    dispatch({ type: "ADD_CAPABILITY", capability: { id, label } });
    setAddValue("");
  }

  function toggleProtocol(key: AgentProtocol) {
    const has = state.agentProtocols.includes(key);
    // Refuse to remove the last remaining protocol instead of silently
    // snapping back to ["https"] — a disabled last-toggle is less
    // surprising than a click that visually appears to do nothing.
    if (has && state.agentProtocols.length === 1) return;
    const next = has ? state.agentProtocols.filter((p) => p !== key) : [...state.agentProtocols, key];
    dispatch({ type: "SET_AGENT_PROTOCOLS", protocols: next });
  }

  const protocolSummary = PROTOCOL_OPTIONS.filter((p) => state.agentProtocols.includes(p.key)).map((p) => p.label).join(", ");

  return (
    <Box sx={{ mx: "auto", maxWidth: 800, px: 6, pt: 6, pb: 20 }}>
      <Box component="header" sx={{ mb: 10 }}>
        <Typography sx={{ mb: 3, fontFamily: "mono", fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "secondary.main" }}>
          Step 2 of 6 · Agent identity
        </Typography>
        <Typography variant="h4" component="h1">
          What should your agent be able to do?
        </Typography>
        <Typography variant="body1" sx={{ mt: 4, color: "text.secondary", maxWidth: 560, lineHeight: 1.7 }}>
          A domain isn&apos;t just where your site lives anymore. It can also be the address where other AI agents find and talk to yours.
        </Typography>
      </Box>

      <Card sx={{ p: { xs: 5, sm: 8 }, display: "flex", flexDirection: "column" }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 3, pb: state.agentEnabled ? 7 : 0 }}>
          <Box sx={{ flex: 1 }}>
            <Switch
              checked={state.agentEnabled}
              onChange={(enabled) => dispatch({ type: "SET_AGENT_ENABLED", enabled })}
              label="Also create an AI agent identity for this domain"
              hint="Optional. Turn it off to launch just a website."
            />
          </Box>
          <HelpTip label="an AI agent identity" title="AI agent identity">
            LaunchName publishes a small record in your domain&apos;s DNS that tells other AI agents this domain has an agent, what it can do, and how to reach it. Your website works the same either way.
          </HelpTip>
        </Box>

        {state.agentEnabled && (
          <>
            <Box component="section" aria-labelledby="sec-identity" sx={SECTION_SX}>
              <SectionHeading id="sec-identity" title="Identity" help="The name and one-line description other agents and people see when they discover your agent.">
                How your agent introduces itself.
              </SectionHeading>
              <Input label="Agent name" value={state.agentName} onChange={(e) => dispatch({ type: "SET_AGENT_NAME", name: e.target.value })} />
              {state.agentProfileLoading ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }} aria-busy="true" aria-label="Drafting a description with Claude">
                  <Skeleton className="h-16 w-full" />
                  <Typography variant="caption">Drafting a description and capabilities from your idea…</Typography>
                </Box>
              ) : (
                <>
                  {state.agentProfileError && (
                    <Alert
                      severity="error"
                      action={
                        <Button size="sm" variant="ghost" onClick={loadProfile}>
                          Retry
                        </Button>
                      }
                    >
                      Couldn&apos;t get AI suggestions. You can still fill this in yourself.
                    </Alert>
                  )}
                  <TextField
                    label="Description"
                    value={state.agentDescription}
                    onChange={(e) => dispatch({ type: "SET_AGENT_DESCRIPTION", description: e.target.value })}
                    multiline
                    minRows={2}
                    fullWidth
                    size="small"
                    helperText="Suggested by Claude from your idea. Edit freely; your changes are saved."
                  />
                </>
              )}
            </Box>

            {!state.agentProfileLoading && (
              <>
                <Box component="section" aria-labelledby="sec-capabilities" sx={SECTION_SX}>
                  <SectionHeading
                    id="sec-capabilities"
                    title="Capabilities"
                    count={state.agentCapabilities.length}
                    help="Capabilities are the specific jobs your agent can do. Other agents search the directory by capability, so name them by the task (for example “Price Quotes”), not by technology."
                  >
                    What other agents can ask yours to do. Add at least one.
                  </SectionHeading>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                    {state.agentCapabilities.map((c) => (
                      <CapabilityChip key={c.id} label={c.label} onRemove={() => dispatch({ type: "REMOVE_CAPABILITY", id: c.id })} />
                    ))}
                  </Box>
                  <CapabilityInput value={addValue} onChange={setAddValue} onAdd={addCapability} placeholder="Add a capability (e.g. Itinerary Generation)" />
                </Box>

                <Box component="section" aria-labelledby="sec-communication" sx={{ ...SECTION_SX, pb: 0 }}>
                  <SectionHeading id="sec-communication" title="Communication" help="The ways other agents can connect to yours. Pick every method your agent supports; at least one is required.">
                    How other agents can talk to yours. Choose one or more.
                  </SectionHeading>
                  <Box role="group" aria-label="Communication methods" sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 3 }}>
                    {PROTOCOL_OPTIONS.map((p) => {
                      const selected = state.agentProtocols.includes(p.key);
                      const isLastOne = selected && state.agentProtocols.length === 1;
                      return (
                        <Box
                          key={p.key}
                          component="button"
                          type="button"
                          role="checkbox"
                          aria-checked={selected}
                          aria-disabled={isLastOne}
                          title={isLastOne ? "At least one communication method is required" : undefined}
                          onClick={() => toggleProtocol(p.key)}
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "flex-start",
                            textAlign: "left",
                            cursor: isLastOne ? "not-allowed" : "pointer",
                            p: 4,
                            borderRadius: 3,
                            border: "1px solid",
                            borderColor: selected ? "rgba(124,92,255,0.6)" : "divider",
                            backgroundColor: selected ? "rgba(124,92,255,0.09)" : "transparent",
                            color: "inherit",
                            font: "inherit",
                            transition: "border-color 150ms ease, background-color 150ms ease",
                            "&:hover": { borderColor: selected ? "rgba(124,92,255,0.8)" : "text.disabled" },
                            "&:focus-visible": { outline: "2px solid", outlineColor: "primary.light", outlineOffset: 2 },
                          }}
                        >
                          <Box sx={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                            <Typography component="span" sx={{ fontSize: "0.875rem", fontWeight: 600, color: selected ? "primary.light" : "text.primary" }}>
                              {p.label}
                            </Typography>
                            <Box
                              component="span"
                              aria-hidden
                              sx={{ width: 16, height: 16, borderRadius: 0.75, border: "1.5px solid", borderColor: selected ? "primary.main" : "text.disabled", backgroundColor: selected ? "primary.main" : "transparent", display: "grid", placeItems: "center", color: "#fff", fontSize: 11, lineHeight: 1 }}
                            >
                              {selected ? "✓" : ""}
                            </Box>
                          </Box>
                          <Typography component="span" variant="caption" sx={{ display: "block", mt: 2, color: "text.secondary", lineHeight: 1.6 }}>
                            {p.hint}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              </>
            )}
          </>
        )}
      </Card>

      <Box sx={{ mt: 8, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4, flexWrap: "wrap" }}>
        <Typography variant="caption" sx={{ color: "text.secondary" }} aria-live="polite">
          {state.agentEnabled
            ? `${state.agentCapabilities.length} capabilit${state.agentCapabilities.length === 1 ? "y" : "ies"} · ${protocolSummary}`
            : "Website only, no agent identity"}
        </Typography>
        <Button
          onClick={onContinue}
          disabled={state.agentEnabled && (state.agentProfileLoading || state.agentCapabilities.length === 0)}
        >
          Continue to domains →
        </Button>
      </Box>
    </Box>
  );
}

function SectionHeading({ id, title, help, count, children }: { id: string; title: string; help: string; count?: number; children: React.ReactNode }) {
  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography id={id} variant="h6" component="h2">
          {title}
        </Typography>
        {count !== undefined && (
          <Typography component="span" sx={{ ml: 0.5, fontFamily: "mono", fontSize: "0.75rem", color: "text.disabled" }}>
            {count}
          </Typography>
        )}
        <HelpTip label={title} title={title}>
          {help}
        </HelpTip>
      </Box>
      <Typography variant="body2" sx={{ mt: 1.5 }}>
        {children}
      </Typography>
    </Box>
  );
}
