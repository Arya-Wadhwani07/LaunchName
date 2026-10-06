# LaunchName — Tech Stack

## Core

- **Next.js 14** (App Router) — framework, server-rendered pages + API routes
- **React 18**
- **TypeScript 5.5**

## Design system

- **Material UI (MUI) v9** — component library
- **Emotion** — styling engine MUI runs on
- **Tailwind CSS 3.4** — utility layer for custom animation keyframes only
- **Motion** (Framer Motion) — navbar, hover/tap springs, scroll-driven 3D DNS lookup, background
- **Phosphor Icons** — every icon on the site
- **Fraunces** + **Inter** + **JetBrains Mono** — headline, UI and technical fonts, loaded via `next/font/google`

## APIs / external services

- **name.com Core API (v1)** — domain search, availability, pricing, registration, DNS records, TLD requirements. HTTP Basic Auth via `NAMECOM_USERNAME` / `NAMECOM_API_TOKEN`.
- **Anthropic Claude API** (`claude-sonnet-4-5`) — brand name generation, agent capability brainstorming, in-character agent chat replies. Requires `ANTHROPIC_API_KEY`.

## Data / validation

- Hand-written server-side validation (`lib/validation.ts`) — DNS record rules checked before any name.com call
- **React Context** — client-side wizard state
- In-memory server store (no database — name.com is the source of truth for domains/DNS)

## Dev tooling

- **ESLint** (`eslint-config-next`)
- **PostCSS** + **Autoprefixer**
- **Vitest** — unit + integration tests (`npm test`)
- **Playwright** — used for browser QA during development (not a project dependency)

---

## Libraries to install

```bash
npm install @anthropic-ai/sdk @emotion/react @emotion/styled @mui/material @mui/material-nextjs @phosphor-icons/react clsx motion next react react-dom
```

```bash
npm install -D @types/node @types/react @types/react-dom autoprefixer eslint eslint-config-next postcss tailwindcss typescript vitest
```

Or just run `npm install` in the project root — everything above is already listed in `package.json`.

### Exact versions (from package.json)

| Package | Version |
|---|---|
| next | ^14.2.15 |
| react | ^18.3.1 |
| react-dom | ^18.3.1 |
| typescript | ^5.5.0 |
| vitest | ^3.2.7 |
| @mui/material | ^9.4.0 |
| motion | ^14.0.0 |
| @phosphor-icons/react | ^2.1.10 |
| @mui/material-nextjs | ^9.4.0 |
| @emotion/react | ^11.14.0 |
| @emotion/styled | ^11.14.1 |
| tailwindcss | ^3.4.13 |
| @anthropic-ai/sdk | ^0.122.0 |
| clsx | ^2.1.1 |
| eslint | ^8.57.0 |
| eslint-config-next | ^14.2.15 |
| postcss | ^8.4.47 |
| autoprefixer | ^10.4.20 |
| @types/node | ^20.14.0 |
| @types/react | ^18.3.0 |
| @types/react-dom | ^18.3.0 |
