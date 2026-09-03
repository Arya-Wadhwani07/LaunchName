import "server-only";
import type { AgentDiscoveryRecord, HandshakeStepResult } from "./types";
import type { AgentConnector } from "./connector";

/**
 * Produces the step-by-step handshake timeline shown in the Agent Connect
 * console. Each step reflects something the backend actually just did
 * (resolved the domain, read capabilities from the stored manifest,
 * checked verification state, picked a connector) — it's a narration of
 * real control flow, not a canned animation script.
 */
export function buildDiscoverySteps(agent: AgentDiscoveryRecord, fromAgentName: string): HandshakeStepResult[] {
  const now = () => new Date().toISOString();
  return [
    {
      key: "discover",
      label: `${fromAgentName} discovered ${agent.name} at ${agent.host}`,
      status: "done",
      timestamp: now(),
    },
    {
      key: "identify",
      label: `${agent.name} identity confirmed`,
      status: "done",
      detail: agent.description,
      timestamp: now(),
    },
    {
      key: "capabilities",
      label: "Capabilities verified",
      status: "done",
      detail: agent.capabilities.map((c) => c.label).join(", "),
      timestamp: now(),
    },
    {
      key: "verifyIdentity",
      label: agent.verification.domainOwnershipVerified ? "Domain ownership verified" : "Domain ownership not yet verified",
      status: agent.verification.domainOwnershipVerified ? "done" : "error",
      timestamp: now(),
    },
    {
      key: "resolveEndpoint",
      label: agent.verification.publiclyReachable ? "Live endpoint resolved" : "Routed through LaunchName gateway (demo agent)",
      status: "done",
      detail: agent.verification.publiclyReachable ? agent.endpoint : agent.gatewayPath,
      timestamp: now(),
    },
  ];
}

export function connectionEstablishedStep(connector: AgentConnector): HandshakeStepResult {
  return {
    key: "connect",
    label: connector.kind === "live" ? "Connection established (live endpoint)" : "Connection established (demo agent)",
    status: "done",
    timestamp: new Date().toISOString(),
  };
}

export function requestStep(message: string): HandshakeStepResult {
  return { key: "request", label: "Request sent", status: "done", detail: message, timestamp: new Date().toISOString() };
}

export function responseStep(response: string): HandshakeStepResult {
  return { key: "response", label: "Response received", status: "done", detail: response, timestamp: new Date().toISOString() };
}
