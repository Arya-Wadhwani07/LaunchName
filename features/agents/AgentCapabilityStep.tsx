"use client";

import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import Card from "@mui/material/Card";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import { useLaunch } from "@/context/LaunchContext";
import { Button, Input, Switch } from "@/components/ui/primitives";
import { CapabilityChip, CapabilityInput } from "@/components/agent/CapabilityChip";
import { Skeleton } from "@/components/ui/data";
import type { AgentProtocol } from "@/lib/agents/types";

const PROTOCOL_OPTIONS: { key: AgentProtocol; label: string; hint: string }[] = [
  { key: "https", label: "HTTPS", hint: "Standard request/response" },
  { key: "streaming", label: "Streaming", hint: "Long-lived, incremental responses" },
  { key: "mcp", label: "MCP-compatible", hint: "Speaks the Model Context Protocol" },
];

export function AgentCapabilityStep({ onContinue }: { onContinue: () => void }) {
  const { state, dispatch } = useLaunch();
  const fetchedFor = useRef<string | null>(null);
  const [addValue, setAddValue] = useState("");

  useEffect(() => {
    if (!state.agentEnabled || !state.selectedBrand) return;
    if (fetchedFor.current === state.selectedBrand.name) return;
    fetchedFor.current = state.selectedBrand.name;
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.agentEnabled, state.selectedBrand]);

  async function loadProfile() {
    if (!state.selectedBrand) return;
    dispatch({ type: "AGENT_PROFILE_LOADING" });
    try {
      const res = await fetch("/api/agents/brainstorm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: state.idea, agentName: state.agentName || state.selectedBrand.name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? "Couldn't draft an agent profile.");
      dispatch({
        type: "AGENT_PROFILE_SUCCESS",
        description: data.profile.description,
        category: data.profile.category,
        capabilities: data.profile.capabilities,
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

  return (
    <Box sx={{ mx: "auto", maxWidth: 720, px: 3, py: 8 }}>
      <Box sx={{ mb: 4, textAlign: "center" }}>
        <Typography sx={{ mb: 1, fontFamily: "mono", fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "secondary.light" }}>
          Step 2 · Agent identity
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 600, letterSpacing: "-0.01em" }}>
          What should your agent be able to do?
        </Typography>
        <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
          A domain isn&apos;t just where your site lives anymore. It can be the address your agent is discovered at, too.
        </Typography>
      </Box>

      <Card sx={{ p: 3 }}>
        <Switch
          checked={state.agentEnabled}
          onChange={(enabled) => dispatch({ type: "SET_AGENT_ENABLED", enabled })}
          label="Also create an AI agent identity for this domain"
          hint="Optional, turn off to just launch a website, as before"
        />

        {state.agentEnabled && (
          <Box sx={{ mt: 3, display: "flex", flexDirection: "column", gap: 2.5 }}>
            <Input
              label="Agent name"
              value={state.agentName}
              onChange={(e) => dispatch({ type: "SET_AGENT_NAME", name: e.target.value })}
            />

            {state.agentProfileLoading ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-8 w-2/3" />
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
                    Couldn&apos;t get AI suggestions. You can still fill this in yourself below.
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
                />

                <Box>
                  <Typography variant="caption" sx={{ mb: 1, display: "block", fontWeight: 500, color: "text.secondary" }}>
                    Capabilities
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {state.agentCapabilities.map((c) => (
                      <CapabilityChip key={c.id} label={c.label} onRemove={() => dispatch({ type: "REMOVE_CAPABILITY", id: c.id })} />
                    ))}
                  </Box>
                  <CapabilityInput
                    value={addValue}
                    onChange={setAddValue}
                    onAdd={addCapability}
                    placeholder="Add a capability (e.g. Itinerary Generation)"
                  />
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ mb: 1, display: "block", fontWeight: 500, color: "text.secondary" }}>
                    Communication
                  </Typography>
                  <ToggleButtonGroup
                    value={state.agentProtocols}
                    onChange={(_, next: AgentProtocol[]) => {
                      // ToggleButtonGroup's own multi-select would allow an
                      // empty selection — route through toggleProtocol so the
                      // last-remaining-protocol guard still applies.
                      const removed = state.agentProtocols.find((p) => !next.includes(p));
                      const added = next.find((p) => !state.agentProtocols.includes(p));
                      if (removed) toggleProtocol(removed);
                      else if (added) toggleProtocol(added);
                    }}
                    size="small"
                    sx={{ flexWrap: "wrap", gap: 1 }}
                  >
                    {PROTOCOL_OPTIONS.map((p) => {
                      const selected = state.agentProtocols.includes(p.key);
                      const isLastOne = selected && state.agentProtocols.length === 1;
                      return (
                        <Tooltip key={p.key} title={isLastOne ? "At least one protocol is required" : p.hint}>
                          <span>
                            <ToggleButton
                              value={p.key}
                              disabled={isLastOne}
                              sx={{
                                textTransform: "none",
                                borderRadius: 999,
                                border: "1px solid",
                                borderColor: "divider",
                                px: 1.75,
                                py: 0.5,
                                fontSize: "0.75rem",
                                color: "text.secondary",
                                "&.Mui-selected": {
                                  color: "primary.light",
                                  bgcolor: "rgba(124,92,255,0.1)",
                                  borderColor: "rgba(124,92,255,0.5)",
                                },
                              }}
                            >
                              {p.label}
                            </ToggleButton>
                          </span>
                        </Tooltip>
                      );
                    })}
                  </ToggleButtonGroup>
                </Box>
              </>
            )}
          </Box>
        )}

        <Button
          size="lg"
          className="mt-8 w-full"
          onClick={onContinue}
          disabled={state.agentEnabled && (state.agentProfileLoading || state.agentCapabilities.length === 0)}
        >
          Continue to domain search →
        </Button>
      </Card>
    </Box>
  );
}
