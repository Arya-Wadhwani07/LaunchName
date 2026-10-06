"use client";

import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { BrowserIcon, CpuIcon, DatabaseIcon, HardDrivesIcon, TreeStructureIcon, type Icon } from "@phosphor-icons/react";

type NodeId = "browser" | "resolver" | "root" | "tld" | "auth";

interface ResolverNode {
  id: NodeId;
  label: string;
  sub: string;
  x: number; // % across the 3D plane
  y: number; // % down the 3D plane
  icon: Icon;
  tone: string;
}

const NODES: ResolverNode[] = [
  { id: "browser", label: "Your browser", sub: "plately.dev?", x: 12, y: 74, icon: BrowserIcon, tone: "#b9b0de" },
  { id: "resolver", label: "Resolver", sub: "1.1.1.1", x: 40, y: 48, icon: CpuIcon, tone: "#a18aff" },
  { id: "root", label: "Root server", sub: "root zone ( . )", x: 62, y: 14, icon: TreeStructureIcon, tone: "#a18aff" },
  { id: "tld", label: ".dev registry", sub: "a.nic.dev", x: 88, y: 44, icon: DatabaseIcon, tone: "#a18aff" },
  { id: "auth", label: "name.com DNS", sub: "ns1.name.com", x: 70, y: 86, icon: HardDrivesIcon, tone: "#ffa247" },
];
const byId = Object.fromEntries(NODES.map((n) => [n.id, n])) as Record<NodeId, ResolverNode>;

// The real recursive lookup: the resolver walks the hierarchy on the browser's behalf.
const PATH: NodeId[] = ["browser", "resolver", "root", "resolver", "tld", "resolver", "auth", "resolver", "browser"];
const LEGS = PATH.length - 1;
const START = 0.06;
const SPAN = 0.88;
const stops = PATH.map((_, k) => START + (SPAN * k) / LEGS);

const STEPS = [
  {
    legs: [0],
    title: "You type plately.dev",
    body: "Your browser doesn't know where that is. It asks a recursive resolver, usually run by your ISP or a service like 1.1.1.1.",
    wire: "QUERY  plately.dev  A ?",
  },
  {
    legs: [1, 2],
    title: "Root servers point the way",
    body: "The resolver starts at the top of the internet's address book. The root doesn't know the answer, but knows who runs .dev.",
    wire: "REFERRAL  .dev  →  a.nic.dev",
  },
  {
    legs: [3, 4],
    title: "The .dev registry delegates",
    body: "The registry for the extension knows which nameservers are in charge of this exact domain: the ones name.com runs for you.",
    wire: "REFERRAL  plately.dev  →  ns1.name.com",
  },
  {
    legs: [5, 6],
    title: "name.com answers",
    body: "This is the layer LaunchName configures. The records it creates for you through name.com's API are the final answer.",
    wire: "ANSWER  A 76.76.21.21 · TXT _agent-discovery",
  },
  {
    legs: [7],
    title: "Humans and agents can find you",
    body: "The browser connects, and the resolver caches the answer. The same lookup lets AI agents discover your agent from its TXT record.",
    wire: "CONNECTED  ·  cached for 300s",
  },
];

function stepForLeg(leg: number) {
  return STEPS.findIndex((s) => s.legs.includes(leg));
}

function legAt(p: number) {
  return Math.min(LEGS - 1, Math.max(0, Math.floor(((p - START) / SPAN) * LEGS)));
}

export function DnsLookupScene() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  // Until the section is reached, the lookup plays on its own in a loop, so
  // there's motion from the first frame. Once the visitor scrolls into it,
  // their scroll takes over and scrubs the same timeline.
  const auto = useMotionValue(0);
  useEffect(() => {
    if (reduce) return;
    const controls = animate(auto, [0, 1], { duration: 11, ease: "linear", repeat: Infinity, repeatDelay: 1.4 });
    return () => controls.stop();
  }, [auto, reduce]);
  const driver = useTransform(() => {
    const s = scrollYProgress.get();
    return s > 0.002 || reduce ? s : auto.get();
  });
  // A light spring smooths trackpad jitter and the hand-off from autoplay.
  const p = useSpring(driver, { stiffness: 140, damping: 28, mass: 0.4 });
  const [leg, setLeg] = useState(0);
  useMotionValueEvent(p, "change", (v) => {
    const next = legAt(v);
    if (next !== leg) setLeg(next);
  });

  // Camera: the plane tilts and swings as the query travels.
  const rotX = useTransform(p, [0, 0.5, 1], [60, 48, 58]);
  const rotZ = useTransform(p, [0, 0.5, 1], [-22, -4, 16]);
  const zoom = useTransform(p, [0, 0.45, 1], [0.86, 1, 0.94]);
  const planeTransform = useTransform(() => `rotateX(${rotX.get()}deg) rotateZ(${rotZ.get()}deg) scale(${zoom.get()})`);
  // Labels counter-rotate so they always face the viewer.
  const billboard = useTransform(() => `rotateZ(${-rotZ.get()}deg) rotateX(${-rotX.get()}deg)`);

  const px = useTransform(p, stops, PATH.map((id) => byId[id].x));
  const py = useTransform(p, stops, PATH.map((id) => byId[id].y));
  const packetLeft = useTransform(() => `${px.get()}%`);
  const packetTop = useTransform(() => `${py.get()}%`);
  const trailX = useSpring(px, { stiffness: 90, damping: 18 });
  const trailY = useSpring(py, { stiffness: 90, damping: 18 });
  const trailLeft = useTransform(() => `${trailX.get()}%`);
  const trailTop = useTransform(() => `${trailY.get()}%`);
  const progressWidth = useTransform(p, [START, START + SPAN], ["0%", "100%"]);

  const step = stepForLeg(leg);
  const from = PATH[leg];
  const to = PATH[leg + 1];
  const visited = new Set(PATH.slice(0, leg + 2));

  return (
    <section ref={ref} aria-labelledby="dns-scene-title" className="relative" style={{ height: "460vh" }}>
      <div className="sticky top-0 flex h-screen items-start overflow-hidden">
        <div className="mx-auto grid w-full max-w-[1180px] grid-cols-1 items-center gap-6 px-6 pt-20 lg:grid-cols-[0.85fr_1.15fr] lg:gap-10 lg:pt-24">
          <div className="relative z-10 order-2 lg:order-1">
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.14em] text-accent2">What happens when someone visits your domain</p>
            <h2 id="dns-scene-title" className="mb-6 text-balance font-display text-[1.7rem] font-semibold leading-tight text-ink sm:text-[2.6rem]">
              One DNS lookup, five hops, under 100 milliseconds.
            </h2>

            <div className="mb-6 flex items-center gap-1.5" aria-hidden>
              {STEPS.map((s, i) => (
                <motion.span
                  key={s.title}
                  className="h-1.5 rounded-full"
                  animate={{ width: i === step ? 28 : 8, backgroundColor: i <= step ? "#7c5cff" : "#3a3648" }}
                  transition={{ type: "spring", bounce: 0.2, visualDuration: 0.3 }}
                />
              ))}
            </div>

            <div className="relative min-h-[200px]" aria-live="polite">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10, filter: "blur(6px)" }}
                  transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                >
                  <p className="mb-1 font-mono text-xs text-ink-faint">
                    Step {step + 1} of {STEPS.length}
                  </p>
                  <h3 className="mb-2 text-xl font-semibold text-ink">{STEPS[step].title}</h3>
                  <p className="max-w-[46ch] text-[0.9375rem] leading-relaxed text-ink-muted">{STEPS[step].body}</p>
                  <code className="mt-4 inline-block rounded-lg border border-surface-border bg-surface px-3 py-2 font-mono text-xs text-accent-soft">
                    {STEPS[step].wire}
                  </code>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="mt-6 h-px w-full max-w-sm overflow-hidden bg-surface-border">
              <motion.div className="h-full bg-gradient-to-r from-accent to-accent2" style={{ width: progressWidth }} />
            </div>
          </div>

          <div className="relative order-1 h-[42vh] min-h-[300px] lg:order-2 lg:h-[72vh]" style={{ perspective: 1400 }} aria-hidden>
            <motion.div
              className="absolute inset-[6%] rounded-[28px] border border-white/[0.06]"
              style={{
                transform: planeTransform,
                transformStyle: "preserve-3d",
                background:
                  "radial-gradient(ellipse at 50% 50%, rgba(124,92,255,0.10), transparent 70%), repeating-linear-gradient(0deg, rgba(255,255,255,0.035) 0 1px, transparent 1px 44px), repeating-linear-gradient(90deg, rgba(255,255,255,0.035) 0 1px, transparent 1px 44px)",
                boxShadow: "0 0 0 1px rgba(124,92,255,0.08), 0 40px 120px -40px rgba(124,92,255,0.45)",
              }}
            >
              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                {NODES.filter((n) => n.id !== "resolver").map((n) => {
                  const r = byId.resolver;
                  const live = (from === n.id && to === "resolver") || (from === "resolver" && to === n.id);
                  return (
                    <motion.line
                      key={n.id}
                      x1={r.x}
                      y1={r.y}
                      x2={n.x}
                      y2={n.y}
                      vectorEffect="non-scaling-stroke"
                      strokeLinecap="round"
                      animate={{ stroke: live ? "#a18aff" : visited.has(n.id) ? "rgba(161,138,255,0.35)" : "rgba(255,255,255,0.10)", strokeWidth: live ? 2.5 : 1.25 }}
                      strokeDasharray={visited.has(n.id) || live ? "0" : "4 6"}
                      transition={{ duration: 0.3 }}
                    />
                  );
                })}
              </svg>

              {NODES.map((n) => (
                <Tower
                  key={n.id}
                  node={n}
                  active={n.id === from || n.id === to}
                  visited={visited.has(n.id)}
                  connected={n.id === "browser" && leg === LEGS - 1}
                  billboard={billboard}
                />
              ))}

              <motion.div
                className="absolute h-3 w-3 rounded-full bg-accent2/40 blur-[3px]"
                style={{ left: trailLeft, top: trailTop, x: "-50%", y: "-50%", z: 58 }}
              />
              <motion.div
                className="absolute h-4 w-4 rounded-full bg-white"
                style={{
                  left: packetLeft,
                  top: packetTop,
                  x: "-50%",
                  y: "-50%",
                  z: 62,
                  boxShadow: "0 0 0 4px rgba(255,162,71,0.35), 0 0 24px 6px rgba(255,162,71,0.55)",
                }}
              />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** A server drawn as a stack of layers so it reads as a 3D block on the tilted plane. */
function Tower({
  node,
  active,
  visited,
  connected,
  billboard,
}: {
  node: ResolverNode;
  active: boolean;
  visited: boolean;
  connected: boolean;
  billboard: MotionValue<string>;
}) {
  const NodeIcon = node.icon;
  const tone = connected ? "#3ad9b7" : node.tone;
  const layers = [0, 5, 10, 15];
  return (
    <motion.div
      className="absolute"
      style={{ left: `${node.x}%`, top: `${node.y}%`, x: "-50%", y: "-50%", transformStyle: "preserve-3d" }}
      animate={{ z: active ? 34 : visited ? 10 : 0 }}
      transition={{ type: "spring", bounce: 0.25, visualDuration: 0.45 }}
    >
      {layers.map((z, i) => (
        <div
          key={z}
          className="absolute -left-7 -top-7 h-14 w-14 rounded-2xl border"
          style={{
            transform: `translateZ(${z}px)`,
            backgroundColor: i === layers.length - 1 ? "#1d1b24" : "#111015",
            borderColor: i === layers.length - 1 ? (active ? tone : "rgba(255,255,255,0.10)") : "rgba(255,255,255,0.04)",
            boxShadow: i === 0 ? "0 18px 30px rgba(0,0,0,0.6)" : i === layers.length - 1 && active ? `0 0 ${connected ? 40 : 26}px ${tone}${connected ? "aa" : "66"}` : undefined,
          }}
        />
      ))}
      <div className="absolute -left-7 -top-7 flex h-14 w-14 items-center justify-center" style={{ transform: "translateZ(16px)", color: active ? tone : visited ? "#bfbcc9" : "#9491a1" }}>
        <NodeIcon size={24} weight={active ? "duotone" : "regular"} />
      </div>
      <motion.div className="absolute left-0 top-0" style={{ transform: billboard, transformStyle: "preserve-3d" }}>
        <div className="absolute left-1/2 top-9 w-max -translate-x-1/2 text-center" style={{ transform: "translateZ(40px)" }}>
          <div className={`text-[11px] font-semibold ${active ? "text-ink" : "text-ink-muted"}`}>{node.label}</div>
          <div className={`hidden font-mono text-[10px] sm:block ${connected ? "text-good" : "text-ink-faint"}`}>{connected ? "connected ✓" : node.sub}</div>
        </div>
      </motion.div>
    </motion.div>
  );
}
