"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import { Badge, Button, Card } from "@/components/ui/primitives";
import { CapabilityChip } from "@/components/agent/CapabilityChip";
import { HandshakeTimeline } from "@/components/agent/HandshakeTimeline";
import { ErrorState } from "@/components/ui/status";
import { Skeleton } from "@/components/ui/data";
import type { AgentDiscoveryRecord, HandshakeStepResult, AgentConnectorKind } from "@/lib/agents/types";
import { CircleIcon, PaperPlaneRightIcon } from "@phosphor-icons/react";

const REQUESTER_NAME = "StudentPlanner";
const REQUESTER_CAPABILITIES = ["Planning", "Scheduling"];

function AgentNode({
  label,
  name,
  capabilities,
  badge,
  emphasis,
}: {
  label: string;
  name: string;
  capabilities: string[];
  badge?: React.ReactNode;
  emphasis?: boolean;
}) {
  return (
    <Card sx={{ p: 2.5, ...(emphasis && { borderColor: "primary.main" }) }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.75 }}>
        <Typography variant="overline">{label}</Typography>
        {badge}
      </Box>
      <Typography variant="h5" sx={{ color: "text.primary" }}>
        {name}
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 1.5 }}>
        {capabilities.map((c) => (
          <CapabilityChip key={c} label={c} />
        ))}
      </Box>
    </Card>
  );
}

/** The line between the two agent nodes — a real traveling dot while a request is in flight, a steady connected pulse at rest. */
function HandshakeConnector({ active, connected }: { active: boolean; connected: boolean }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: { xs: 32, sm: "100%" } }}>
      <Box
        sx={{
          position: "relative",
          width: { xs: "60%", sm: 40 },
          height: { xs: 2, sm: "60%" },
          minHeight: { sm: 40 },
        }}
      >
        <Box
          sx={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "50%",
            height: "1px",
            backgroundColor: connected ? "rgba(124,92,255,0.35)" : "divider",
          }}
        />
        {active && (
          <Box
            className="animate-packet-travel"
            sx={{
              position: "absolute",
              top: "50%",
              width: 8,
              height: 8,
              marginTop: "-4px",
              marginLeft: "-4px",
              borderRadius: "50%",
              backgroundColor: "primary.light",
              boxShadow: "0 0 8px rgba(124,92,255,0.8)",
            }}
          />
        )}
      </Box>
    </Box>
  );
}

export function AgentConnectConsole({ host }: { host: string }) {
  const [agent, setAgent] = useState<AgentDiscoveryRecord | null>(null);
  const [connectorKind, setConnectorKind] = useState<AgentConnectorKind | null>(null);
  const [handshake, setHandshake] = useState<HandshakeStepResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  useEffect(() => {
    handshakeOnly();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [host]);

  async function handshakeOnly() {
    setError(null);
    try {
      const res = await fetch("/api/agents/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ host, fromAgentName: REQUESTER_NAME }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? "Couldn't reach that agent.");
      setAgent(data.agent);
      setConnectorKind(data.connector);
      setHandshake(data.handshake);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  async function send() {
    if (!message.trim() || !agent) return;
    setSending(true);
    setResponse(null);
    try {
      const res = await fetch("/api/agents/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ host, message: message.trim(), fromAgentName: REQUESTER_NAME }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? "The agent didn't respond.");
      setConnectorKind(data.connector);
      setHandshake(data.handshake);
      setResponse(data.response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSending(false);
    }
  }

  if (error) return <ErrorState description={error} onRetry={handshakeOnly} />;
  if (!agent) {
    return (
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-56 w-full" />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr auto 1fr" }, alignItems: "center", gap: { xs: 1, sm: 2 } }}>
        <AgentNode label="Your agent" name={REQUESTER_NAME} capabilities={REQUESTER_CAPABILITIES} />
        <HandshakeConnector active={sending} connected={handshake.length > 0} />
        <AgentNode
          label="Remote agent"
          name={agent.name}
          capabilities={agent.capabilities.slice(0, 4).map((c) => c.label)}
          emphasis
          badge={
            connectorKind && (
              <Badge variant={connectorKind === "live" ? "available" : "premium"}>
                {connectorKind === "live" ? "Live agent" : "Demo agent"}
              </Badge>
            )
          }
        />
      </Box>

      <Card sx={{ p: 2.5 }}>
        <Typography variant="overline" sx={{ display: "block", mb: 2 }}>
          Handshake
        </Typography>
        <HandshakeTimeline steps={handshake} />
      </Card>

      <Card sx={{ p: 2.5 }}>
        <Typography variant="overline" sx={{ display: "block", mb: 1.5 }}>
          Request
        </Typography>
        <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1.5 }}>
          <TextField
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder={`Ask ${agent.name} something within its capabilities…`}
            size="small"
            fullWidth
          />
          <Button onClick={send} disabled={!message.trim() || sending} endIcon={!sending && <PaperPlaneRightIcon size={18} aria-hidden />} sx={{ flexShrink: 0 }}>
            {sending ? "Sending…" : "Send to Agent"}
          </Button>
        </Box>

        {response && (
          <Box className="animate-fade-up" sx={{ mt: 2, borderRadius: 1.5, border: 1, borderColor: "rgba(124,92,255,0.2)", backgroundColor: "rgba(124,92,255,0.05)", p: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5 }}>
              <Box component="span" sx={{ display: "inline-flex", color: "success.main" }}><CircleIcon size={6} weight="fill" aria-hidden /></Box>
              <Typography variant="overline">{agent.name} responded</Typography>
            </Box>
            <Typography variant="body2" sx={{ color: "text.primary" }}>
              {response}
            </Typography>
          </Box>
        )}
      </Card>
    </Box>
  );
}
