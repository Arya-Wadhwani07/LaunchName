import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { AgentConnectorKind, AgentDiscoveryRecord } from "./types";

/**
 * Protocol/provider-agnostic messaging interface. Nothing in
 * app/api/agents/message/route.ts knows or cares which implementation is
 * behind it — that's the point: a real future protocol (MCP, A2A, whatever
 * standardizes) becomes a third class implementing the same shape,
 * without touching the route or the UI.
 */
export interface AgentConnector {
  kind: AgentConnectorKind;
  sendMessage(agent: AgentDiscoveryRecord, message: string): Promise<string>;
}

const REQUEST_TIMEOUT_MS = 6000;

/** Talks to an agent's real, declared HTTP endpoint. Used only when verification has confirmed it's actually reachable. */
export class HttpAgentConnector implements AgentConnector {
  kind: AgentConnectorKind = "live";

  async sendMessage(agent: AgentDiscoveryRecord, message: string): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(agent.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`Agent endpoint responded with HTTP ${res.status}`);
      const data = await res.json().catch(() => ({}));
      return typeof data?.response === "string" ? data.response : JSON.stringify(data);
    } finally {
      clearTimeout(timer);
    }
  }
}

/**
 * Simulates the agent locally for the demo — used whenever the agent's
 * real endpoint isn't reachable (i.e. almost always in name.com's
 * sandbox). Genuinely calls Claude, in character as the agent described
 * by its own manifest, so the response is real generated text rather than
 * a canned string — but it's still a local simulation, not a network call
 * to the agent's own infrastructure, and the UI must always label it
 * "Demo Agent" so that's never ambiguous.
 */
export class DemoAgentConnector implements AgentConnector {
  kind: AgentConnectorKind = "demo";

  async sendMessage(agent: AgentDiscoveryRecord, message: string): Promise<string> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return this.offlineReply(agent, message);

    try {
      const client = new Anthropic({ apiKey });
      const capabilityList = agent.capabilities.map((c) => c.label).join(", ");
      const response = await client.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 300,
        system: `You are "${agent.name}", an AI agent reachable at ${agent.host}. Description: ${agent.description}. Your declared capabilities are: ${capabilityList}. Respond in character, concisely (2-4 sentences), as if actually fulfilling the request within those capabilities. If the request is outside your declared capabilities, say so briefly and suggest what you can actually help with instead. Do not use em dashes.`,
        messages: [{ role: "user", content: message }],
      });
      const textBlock = response.content.find((b) => b.type === "text");
      return textBlock?.type === "text" ? textBlock.text.trim() : this.offlineReply(agent, message);
    } catch {
      return this.offlineReply(agent, message);
    }
  }

  private offlineReply(agent: AgentDiscoveryRecord, message: string): string {
    const cap = agent.capabilities[0]?.label ?? "that";
    return `[Simulated] ${agent.name} received your request ("${message.slice(0, 80)}") and would act on it using its ${cap} capability. Connect a real endpoint or an ANTHROPIC_API_KEY to see a generated response instead of this placeholder.`;
  }
}

/** Picks the right connector for an agent based on what verification actually established. */
export function pickConnector(agent: AgentDiscoveryRecord): AgentConnector {
  return agent.verification.publiclyReachable ? new HttpAgentConnector() : new DemoAgentConnector();
}
