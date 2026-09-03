# LaunchName

**The domain platform for the agentic internet.**

Describe an idea. LaunchName turns it into brand candidates, checks live
domain availability through name.com, registers the one you pick, configures
its DNS, and stands up a generated landing page — all through name.com's
Core API. Optionally, it goes one step further: it can also turn that same
domain into a discoverable AI agent identity, with its own capabilities,
DNS-backed verification, and a live agent-to-agent conversation console.

## Why this isn't a domain search clone

Most domain tools stop at "here's a list of available names." LaunchName
treats name.com as the infrastructure layer for actually launching an idea:
search → availability → pricing → registration → DNS → a live site, in one
continuous flow, with every fact on screen (availability, price, DNS
records) coming from a real API call.

Today, a domain tells *humans* where to find you. LaunchName's agent layer
explores what happens when the same domain and DNS infrastructure also tells
*AI agents* who you are, what you can do, and how to reach you — grounded in
real, currently-proposed DNS-based agent discovery work (DNS-AID, the Agent
Name Service, and related IETF drafts — see "Agent layer" below), not a
name.com feature and not a standardized record type.

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · `@anthropic-ai/sdk`

No database — name.com is the source of truth for domains/DNS; the app
keeps a small in-memory store (`lib/store.ts`) for its own metadata (which
idea/brand a domain came from, the activity log).

## Architecture

```
lib/namecom/          Service layer around name.com's Core API (NOT the deprecated /v4/ API)
  client.ts              Low-level transport: auth, sandbox guard, retries, timeouts
  domains.ts, dns.ts      Typed endpoint wrappers (one function per Core API operation)
  mock.ts                 Isolated mock provider, used only when no credentials are set
  service.ts               Picks real vs. mock, adds business logic (best-pick scoring, etc.)
  errors.ts                 One error taxonomy every route/UI branches on

lib/brand.ts           Claude-based brand naming, with an offline fallback generator
lib/store.ts            In-memory launch metadata (no DB)
lib/validation.ts        Server-side DNS record validation
lib/apiStatus.ts          Tracks which name.com capabilities this session has exercised (debug drawer)

lib/agents/            The agent layer — entirely separate from lib/namecom, sits on top of it
  types.ts                AgentDiscoveryRecord, AgentVerificationState, etc. — see doc comment for the DNS-AID/ANS grounding
  scoring.ts               Human-brand-score / agent-readiness-score heuristics (app logic, not name.com data)
  store.ts                 In-memory agent registry (AgentRegistry)
  discovery.ts              Domain-bound resolution + capability/intent search (AgentResolver)
  verification.ts            Runs the checks LaunchName can actually perform — see "Agent verification" below
  manifest.ts               Builds the JSON manifest + the DNS TXT discovery-marker format
  connector.ts               AgentConnector interface — HttpAgentConnector (real) / DemoAgentConnector (Claude-simulated)
  handshake.ts               Builds the discover→...→response timeline shown in Agent Connect
  brainstorm.ts               Claude-based capability/category suggestion, with an offline fallback

app/api/                Route handlers — the only code that imports lib/namecom or lib/agents
app/, features/         Pages and the step-by-step wizard UI
app/api/gateway/[domain]  LaunchName's own always-on stand-in endpoint for an agent (see below)
components/ui/           Small reusable design system (Button, Card, Table, Toast, ...)
components/domain/       Domain/DNS/launch-specific display components
components/agent/         Agent-specific display components (capability chips, score bars, verification badges, handshake timeline, network graph)
```

The browser never talks to name.com directly:
`Browser → app/api/* → lib/namecom/service.ts → name.com Core API`.
Agent logic never touches name.com directly either — it goes through the
same service layer for anything DNS-shaped:
`Browser → app/api/agents/* → lib/agents/* → lib/namecom/service.ts → name.com Core API`.

## name.com Core API surface used

Verified against the current Core API spec (`docs.name.com`, v1.33.4) —
confirmed the legacy `/v4/` docs are deprecated and the current API lives at
`/core/v1/*`.

| Capability | Endpoint |
|---|---|
| Availability check | `POST /core/v1/domains:checkAvailability` |
| Domain search | `POST /core/v1/domains:search` |
| Pricing | `GET /core/v1/domains/{domainName}:getPricing` |
| Registration | `POST /core/v1/domains` (with `X-Idempotency-Key`) |
| Domain details / list | `GET /core/v1/domains/{domainName}`, `GET /core/v1/domains` |
| DNS records | `GET/POST /core/v1/domains/{domainName}/records`, `PUT/DELETE .../records/{id}` |
| Nameservers | `POST /core/v1/domains/{domainName}:setNameservers` |
| Account balance | `GET /core/v1/accountinfo/balance` |

## Agent layer

Grounded in real research, not invented terminology. The per-agent record
shape and the "navigational completeness" fields (locatability, capability
awareness, protocol awareness, authenticity/integrity) follow the framework
in Seethiraju et al., *"Discovering Agents for Discovery: The Case for
DNS"* (Verisign, [arXiv:2606.02314](https://arxiv.org/abs/2606.02314), 2026),
which surveys real IETF proposals — principally **DNS-AID** ("DNS for AI
Discovery") and the **Agent Name Service (ANS)**. Those proposals encode
agent metadata in **SVCB records with DANE TLSA-backed endpoint
authentication**, resolved over DNSSEC. name.com's Core API doesn't expose
SVCB or DANE record management today (its DNS record types are
A/AAAA/ANAME/CNAME/MX/NS/SRV/TXT), so LaunchName uses a **TXT record as a
practical, honestly-labeled stand-in** — the UI always calls it "agent
discovery metadata," never an official DNS-AID/ANS record, and never claims
name.com has native agent-discovery support.

What's real vs. simulated:

- **Real**: domain registration, the DNS TXT discovery marker, and reading
  it back — all genuine name.com Core API calls. Agent verification's
  "domain ownership" check is a real DNS read-back, not a guess (and it's
  specifically hardened against a subtle failure mode: a sandbox-registered
  domain never claims real public DNS, so an unrelated live website could
  otherwise happen to occupy the same name and produce a false-positive
  "reachable" result — the check requires the response to actually identify
  itself as this agent before counting it).
- **Simulated, clearly labeled**: in name.com's sandbox, a domain's DNS
  never propagates publicly, so its own declared endpoint
  (`https://<domain>/agent`) generally isn't reachable. Agent Connect falls
  back to **LaunchName's own gateway** (`/api/gateway/[domain]`, always
  live) and a `DemoAgentConnector` that genuinely calls Claude, in character
  as the agent, rather than returning a canned string — but the UI always
  shows a "Demo Agent" badge, never "Live Agent," when that's the path in
  use.

Trust is never implied by discovery alone — the four verification states
(domain ownership, identity declared, gateway configured, publicly
reachable) are independent and only ever set true when that specific check
actually ran and passed. There's deliberately no "cryptographic identity"
state, because this build doesn't implement one.

## Environment variables

See `.env.example`. Summary:

- `NAMECOM_USERNAME` / `NAMECOM_API_TOKEN` — Core API credentials. Omit both
  and the app runs on an isolated mock provider instead (same interface,
  clearly labeled in the debug drawer).
- `NAMECOM_ENVIRONMENT` — `sandbox` (default) or `production`. Production
  also requires `ALLOW_NAMECOM_PRODUCTION=true` as an explicit second
  opt-in; the client refuses to call `api.name.com` without it.
- `ANTHROPIC_API_KEY` — optional. Without it, brand generation falls back
  to a deterministic offline generator.
- `LANDING_PAGE_HOST_IP` — IP the DNS bootstrap step points new domains at.

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in NAMECOM_USERNAME / NAMECOM_API_TOKEN for the real API
npm run dev                  # http://localhost:3000
```

Without credentials, the app still runs end-to-end on the mock provider.
`npm run typecheck`, `npm run lint`, and `npm run build` all pass clean.

A Docker path also exists (`make up`) — it runs `scripts/verify_sandbox_env.py`
first, which refuses to start if `.env.local` is missing or if the base URL
looks like production without the explicit opt-in.

## Demo

Click **"Or try the demo"** on the landing page (prepopulates the idea) or
just type your own. Full walkthrough: idea → 5 AI-generated brand names →
**"What should your agent be able to do?"** (optional — off switches back to
the original website-only flow) → live name.com availability grid scored for
both human branding and agent discoverability, with a Best Pick *and* a Best
Agent Pick → pricing/term confirmation → registration progress (real API
calls, staged live: register → DNS → create agent identity → publish
discovery metadata → verify agent → launch) → Launch Center with DNS
records, verification badges, activity log, and a generated landing page at
`/site/[slug]` → **Agent Directory** (`/agents`) to browse by capability or
resolve a domain to its published agents → **Agent Connect**
(`/agents/[domain]/connect`) for a live agent-to-agent handshake and
conversation → `/dashboard` (now with Agents and Agent Directory tabs) for
ongoing management. The debug drawer (bottom of Launch Center, or "API
activity" in the dashboard) shows exactly which name.com capabilities have
fired this session.

## Known limitations

- Runs against name.com's **sandbox**, not production — no real card is
  charged, and DNS changes are readable back through the API but don't
  propagate publicly (documented sandbox behavior, not a bug).
- Sandbox domains can't be deleted, so re-running the demo with the same
  brand name will correctly show that domain as taken — the app handles
  this as the intended "someone got there first" edge case.
- Launch and agent metadata are in-memory only (reset on server restart) by
  design — name.com itself remains the durable source of truth for domains
  and DNS.
- The agent layer supports multiple agents per domain (via subdomains /
  "publication points") in its data model and the domain-bound discovery
  UI, but the guided launch wizard only ever creates one, at the domain's
  apex, per run.
