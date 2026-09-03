/**
 * Internal agent metadata model for LaunchName's "agentic internet" layer.
 *
 * Modeled after the shape of real, currently-proposed DNS-based agent
 * discovery work — principally DNS-AID ("DNS for AI Discovery", an active
 * IETF DNSOP Internet-Draft) and the Agent Name Service (ANS, an IETF
 * draft from the AI agent security community) — as surveyed in Seethiraju
 * et al., "Discovering Agents for Discovery: The Case for DNS" (Verisign,
 * arXiv:2606.02314, 2026). That paper's evaluation framework names three
 * things any DNS-based agent discovery scheme needs: locatability,
 * capability awareness, protocol awareness, plus authenticity/integrity —
 * this model captures each of those as an explicit field.
 *
 * None of this is a name.com feature or a standardized DNS record type.
 * name.com has no native concept of an "agent" — we only use name.com for
 * what it actually does: domains and DNS records. Everything agent-shaped
 * lives here and is layered on top.
 *
 * Forward-compatibility / honesty note: DNS-AID's actual design encodes
 * this metadata in SVCB records with DANE TLSA-backed endpoint
 * authentication, resolved over DNSSEC. name.com's Core API doesn't
 * support SVCB or DANE record management today (its DNS record types are
 * A/AAAA/ANAME/CNAME/MX/NS/SRV/TXT — see lib/namecom/types.ts), so
 * lib/agents/manifest.ts and verification.ts use a plain TXT record as a
 * practical, honestly-labeled stand-in, not a claim of protocol parity.
 * If name.com ever exposes SVCB/DANE record management, only those two
 * files would need to change.
 */

export type AgentProtocol = "https" | "streaming" | "mcp";

export interface AgentCapability {
  /** Stable slug, e.g. "travel-planning". Used for discovery matching. */
  id: string;
  /** Display label, e.g. "Travel Planning". */
  label: string;
}

/** Common capability categories used for directory browsing/filtering. */
export type AgentCategory =
  | "travel"
  | "finance"
  | "education"
  | "developer-tools"
  | "commerce"
  | "productivity"
  | "research"
  | "customer-support"
  | "other";

export type AgentConnectorKind = "live" | "demo";

/**
 * What LaunchName has actually established about an agent — kept as
 * separate booleans on purpose. Discovery never implies trust; each of
 * these is only set true when the corresponding check actually ran and
 * passed. There is no "cryptographic verification" state because this
 * build doesn't implement one — don't add it without also implementing it.
 */
export interface AgentVerificationState {
  /** A TXT record with our discovery marker was read back from name.com's DNS API for this host. */
  domainOwnershipVerified: boolean;
  /** The manifest has a name, description, at least one capability, and an endpoint URL. */
  identityDeclared: boolean;
  /** LaunchName's own gateway route for this agent responded to a real internal request. */
  gatewayConfigured: boolean;
  /** A real HTTP request to the agent's OWN declared endpoint succeeded (not the LaunchName gateway). */
  publiclyReachable: boolean;
  lastCheckedAt?: string;
  /** Human-readable explanation for the current publiclyReachable value — esp. important when false. */
  reachabilityNote?: string;
}

export type AgentLifecycleStatus = "draft" | "published" | "verified";

/**
 * The canonical per-agent record — one agent, bound to one host (a root
 * domain or a subdomain of one), carrying protocol/capabilities/endpoint/
 * identity/verification, in the spirit of DNS-AID's per-agent metadata.
 */
export interface AgentDiscoveryRecord {
  id: string;
  /** Full host this agent is published at, e.g. "tripilot.ai" or "flights.tripilot.ai". */
  host: string;
  /** The registered root domain that owns this host, e.g. "tripilot.ai". */
  rootDomain: string;
  /** Subdomain label relative to the root, "@" if the agent is at the apex. */
  publicationPoint: string;
  name: string;
  description: string;
  capabilities: AgentCapability[];
  category: AgentCategory;
  protocols: AgentProtocol[];
  /** The agent's own declared endpoint, e.g. "https://tripilot.ai/agent" — may not be publicly reachable in sandbox. */
  endpoint: string;
  /** LaunchName's own always-reachable stand-in path for this agent, e.g. "/api/gateway/tripilot.ai". */
  gatewayPath: string;
  verification: AgentVerificationState;
  status: AgentLifecycleStatus;
  createdAt: string;
  discoveryRecordId?: number;
}

/** What lib/agents/discovery.ts returns when resolving a root domain to its published agents — LaunchName's domain-scoped discovery index. */
export interface DomainAgentIndex {
  rootDomain: string;
  agentCount: number;
  publicationPoints: string[];
  agents: AgentDiscoveryRecord[];
}

export interface AgentDirectoryFilters {
  query?: string;
  capability?: string;
  category?: AgentCategory;
  protocol?: AgentProtocol;
}

/** The JSON manifest shape shown to users / servable at the gateway path. */
export interface AgentManifest {
  name: string;
  domain: string;
  description: string;
  protocols: AgentProtocol[];
  capabilities: string[];
  endpoint: string;
  identity: { domain: string };
}

export interface HandshakeStepResult {
  key:
    | "discover"
    | "identify"
    | "capabilities"
    | "verifyIdentity"
    | "resolveEndpoint"
    | "connect"
    | "request"
    | "response";
  label: string;
  status: "done" | "error";
  detail?: string;
  timestamp: string;
}

export interface AgentMessageResult {
  connector: AgentConnectorKind;
  message: string;
  response: string;
  handshake: HandshakeStepResult[];
}
