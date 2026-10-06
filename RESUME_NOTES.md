# LaunchName — Resume Notes

Raw material for resume bullets / portfolio writeups. Written for pulling from, not for pasting verbatim.

## One-line summary

**LaunchName** — a full-stack hackathon app that takes a one-sentence product idea to a registered domain, configured DNS, and a live landing page in one flow, powered by name.com's live Core API and Anthropic's Claude API. Extended with an experimental "agentic internet" layer: AI agents get a discoverable identity bound to their domain, verified through DNS, and can find and talk to each other.

## The problem it solves

Domain search tools stop at "is this available." LaunchName carries the idea all the way through: idea → AI-generated brand names → live domain search/pricing → registration → DNS setup → live page → (optionally) an AI agent identity discoverable by other agents. Every step hits a real API — nothing is a static list or a fabricated price.

## Tech stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Design system**: Material UI (MUI) v9 + Emotion, built on a custom token-driven theme (single source of truth for color/spacing/radius/motion, 25+ themed component overrides) — not default MUI styling
- **AI**: Anthropic Claude API (`claude-sonnet-4-5`) — brand name generation, agent capability brainstorming, in-character agent-to-agent chat
- **Domain infrastructure**: name.com Core API (v1, current — not the deprecated v4) — search, availability, pricing, registration, DNS CRUD, per-TLD registration-year requirements, account balance
- **Validation**: hand-written server-side validation (`lib/validation.ts`) for DNS records, plus per-route request checks
- **State**: React Context (client wizard state) + in-memory server store (no database — name.com is the system of record for domains/DNS)
- **Testing**: Vitest unit + integration suites (71 tests: wizard state, DNS validation, palette contrast, API routes end-to-end), plus Playwright browser runs against the live sandbox during development
- **Motion/graphics**: hand-built Canvas 2D particle system and CSS keyframe animations — no animation library

## Technical highlights (resume-bullet material)

- **Built a full-stack Next.js/TypeScript application integrating a live third-party REST API** (name.com Core API) for domain search, registration, and DNS record management, with all credentials kept server-side and a clean provider abstraction (`lib/namecom/`) that falls back to a matching mock implementation when no credentials are present.
- **Designed and implemented a custom design system on Material UI** — a token file (color, spacing, radius, motion) driving both an MUI theme and 25+ component-level overrides, replacing a prior ad hoc Tailwind implementation across ~20 pages/components while preserving hand-built Canvas/SVG pieces where a component library didn't fit.
- **Diagnosed and fixed a real, non-obvious production bug**: name.com enforces per-TLD minimum registration years (e.g. `.ai` requires 2+ years) which a hardcoded 1–3 year picker didn't account for, causing live registration failures. Fixed by calling name.com's own TLD-requirements endpoint and rendering only valid options dynamically, with a contextual explanation in the UI.
- **Diagnosed and fixed a build-tooling bug**: two concurrent `next dev` processes writing to the same `.next` build cache produced silent, non-deterministic 404s on every CSS/JS/font asset (page loaded, but with zero styling) — root-caused via network-request inspection rather than guessing, then fixed at the process level.
- **Integrated Anthropic's Claude API for three distinct AI-driven features**: brand name generation from a one-sentence idea, autonomous brainstorming of an AI agent's capabilities/category, and in-character conversational responses when one agent "talks" to another.
- **Designed and built an experimental AI-agent-discovery feature grounded in real research** (DNS-AID and Agent Name Service, per a Verisign-authored paper) rather than inventing a fictional API — agents get a DNS TXT-record-verified identity, with the UI always honestly labeling real vs. simulated behavior (since name.com's sandbox can't resolve publicly).
- **Wrote end-to-end Playwright test scripts to verify real user flows against live APIs** (not mocks) throughout development — catching real bugs including a hydration warning from invalid heading nesting, a CSS `overflow: hidden` clipping bug on badge components, and the layout-overlap/build-cache issues above.
- **Built a 6-step guided wizard** (idea → brand → agent identity → domain search/compare → registration progress → launch) with real-time progress tracking reflecting actual API call state, not a simulated progress bar.

## Notable engineering decisions (good "why" material for interviews)

- No database: name.com itself is treated as the source of truth for domains/DNS, with a lightweight in-memory store only for session-scoped launch/agent metadata — deliberately avoiding a duplicated, driftable copy of state name.com already owns.
- Explicit real-vs-simulated labeling throughout the agent layer: LaunchName's own gateway stands in for agent endpoints unreachable from name.com's sandbox, but the UI always says "Demo Agent" vs "Live Agent" rather than blurring the two.
- Theme built as three layers (`tokens.ts` → `theme.ts` → `components.ts`) so no component hardcodes a color/spacing/radius value — a deliberate constraint to keep 20+ pages visually consistent under time pressure.

## Context

Built solo for a hackathon centered on name.com API integration (judged on API integration depth, creativity, technical execution, real-world viability, and presentation). Target model: `claude-sonnet-5` conversation, built primarily through Claude Code.
