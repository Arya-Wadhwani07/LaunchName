import { LogoMark } from "@/components/brand/LogoMark";
import Link from "next/link";
import { FlowDiagram } from "@/features/about/FlowDiagram";
import { PoweredByBadge } from "@/components/domain/PoweredBy";
import { Button } from "@/components/ui/primitives";

export const metadata = {
  title: "About - LaunchName",
  description: "How LaunchName turns an idea into a live domain, and optionally a discoverable AI agent, end to end.",
};

export default function AboutPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="bg-noise pointer-events-none absolute inset-0 opacity-30" />
      <div className="bg-mesh pointer-events-none absolute inset-x-0 top-[-200px] h-[560px] animate-drift" />

      <nav className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2">
          <LogoMark size={24} />
          <span className="font-semibold tracking-tight">LaunchName</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/agents" className="hidden text-sm text-ink-muted transition-colors hover:text-ink sm:inline">
            Agent Directory
          </Link>
          <Link href="/flashcards" className="hidden text-sm text-ink-muted transition-colors hover:text-ink sm:inline">
            Flashcards
          </Link>
          <Link href="/dashboard" className="text-sm text-ink-muted transition-colors hover:text-ink">
            Dashboard
          </Link>
          <PoweredByBadge className="hidden sm:inline-flex" />
        </div>
      </nav>

      <section className="relative mx-auto max-w-3xl px-6 pb-8 pt-16 text-center">
        <div className="mb-4 animate-fade-up font-mono text-xs uppercase tracking-widest text-accent-soft">How it works</div>
        <h1 className="animate-fade-up text-balance font-display text-4xl font-semibold text-ink [animation-delay:60ms] sm:text-5xl">
          One idea. A real domain. Optionally, a real agent.
        </h1>
        <p className="mt-5 animate-fade-up text-balance text-lg leading-relaxed text-ink-muted [animation-delay:120ms]">
          Most domain tools stop at search. LaunchName walks the whole path. Click through each stage below to see
          what actually happens, and which system is doing the work.
        </p>
      </section>

      <section className="relative mx-auto max-w-4xl px-6 py-10">
        <FlowDiagram />
      </section>

      <section className="relative mx-auto max-w-4xl px-6 py-10">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <PillarCard
            title="Real infrastructure"
            body="Availability, pricing, registration, and DNS all come from live calls to name.com's Core API, never a static list or a fabricated price."
            accent="good"
          />
          <PillarCard
            title="Honest about what's simulated"
            body="Name.com's sandbox can't resolve publicly, so agent endpoints route through LaunchName's own gateway, always labeled Demo, never Live, when that's the path in use."
            accent="accent2"
          />
          <PillarCard
            title="Grounded, not invented"
            body="The agent layer follows real DNS-based discovery research (DNS-AID, ANS) rather than a made-up standard, and never claims name.com natively supports it."
            accent="accent"
          />
        </div>
      </section>

      <section className="relative mx-auto max-w-2xl px-6 py-16 text-center">
        <h2 className="font-display text-3xl font-semibold text-ink">See it end to end</h2>
        <p className="mt-2 text-sm text-ink-faint">Ninety seconds, start to finish, or explore it a piece at a time.</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link href="/launch?idea=An%20AI-powered%20study%20planner%20for%20college%20students&demo=1">
            <Button size="lg">Try the demo →</Button>
          </Link>
          <Link href="/flashcards">
            <Button size="lg" variant="secondary">
              Explore in flashcards
            </Button>
          </Link>
          <Link href="/agents">
            <Button size="lg" variant="ghost">
              Browse the Agent Directory
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}

function PillarCard({ title, body, accent }: { title: string; body: string; accent: "good" | "accent" | "accent2" }) {
  const dot = accent === "good" ? "bg-good" : accent === "accent2" ? "bg-accent2" : "bg-accent";
  return (
    <div className="elevate rounded-lg border border-surface-border bg-surface p-5 shadow-elevation-1">
      <span className={`mb-3 inline-block h-1.5 w-1.5 rounded-full ${dot}`} />
      <div className="mb-1.5 text-sm font-medium text-ink">{title}</div>
      <div className="text-xs leading-relaxed text-ink-faint">{body}</div>
    </div>
  );
}
