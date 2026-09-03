import { notFound } from "next/navigation";
import { getLaunchBySlug } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function GeneratedSitePage({ params }: { params: { slug: string } }) {
  const launch = getLaunchBySlug(params.slug);
  if (!launch) notFound();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 text-center">
      <div className="bg-noise pointer-events-none fixed inset-0 opacity-30" />
      <div
        className="pointer-events-none fixed left-1/2 top-1/3 h-[420px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.12] blur-[110px]"
        style={{ background: "radial-gradient(circle, #7c5cff 0%, transparent 70%)" }}
      />

      <div className="relative z-10 flex max-w-xl flex-col items-center">
        <div className="mb-6 h-8 w-8 rounded-lg bg-gradient-to-br from-accent to-accent-dim" />
        <h1 className="text-4xl font-semibold tracking-tight text-ink sm:text-5xl">{launch.brandName}</h1>
        <p className="mt-4 text-lg text-ink-muted">{launch.tagline}</p>
        <p className="mt-2 max-w-md text-sm text-ink-faint">{launch.idea}</p>

        <button className="mt-8 h-11 rounded-md bg-ink px-6 text-sm font-medium text-canvas transition-transform hover:bg-white active:scale-[0.98]">
          Join the waitlist
        </button>

        <div className="mt-16 flex items-center gap-6 rounded-lg border border-surface-border bg-surface/60 px-6 py-4 text-left text-xs">
          <div>
            <div className="text-ink-faint">Domain</div>
            <div className="font-mono text-ink">{launch.domainName}</div>
          </div>
          <div className="h-8 w-px bg-surface-border" />
          <div>
            <div className="text-ink-faint">DNS</div>
            <div className="text-good">{launch.status === "domain_registered" ? "Pending" : "Configured"}</div>
          </div>
          <div className="h-8 w-px bg-surface-border" />
          <div>
            <div className="text-ink-faint">Status</div>
            <div className="text-good">{launch.status === "live" ? "Live" : "Preparing your launch"}</div>
          </div>
        </div>

        <div className="mt-8 text-[11px] text-ink-faint">
          Built with LaunchName · Domain infrastructure by <span className="text-ink-muted">name.com</span>
        </div>
      </div>
    </main>
  );
}
