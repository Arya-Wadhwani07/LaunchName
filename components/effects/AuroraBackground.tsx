"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

// Palette glows: violet base, amber contrast, lavender support (golden-ratio palette).
const GLOWS = [
  { color: "rgba(124,92,255,0.38)", size: 680, left: "-8%", top: "-22%", x: ["0%", "9%", "-3%"], y: ["0%", "7%", "-4%"], duration: 24 },
  { color: "rgba(255,162,71,0.20)", size: 560, left: "62%", top: "-14%", x: ["0%", "-8%", "4%"], y: ["0%", "10%", "2%"], duration: 30 },
  { color: "rgba(154,141,206,0.22)", size: 520, left: "30%", top: "18%", x: ["0%", "6%", "-6%"], y: ["0%", "-6%", "5%"], duration: 36 },
];

/**
 * Drifting aurora glows over a perspective grid floor that streams toward
 * the viewer — the "traffic" metaphor for queries moving across the network.
 * Purely decorative; static when the user prefers reduced motion.
 */
export function AuroraBackground() {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const glowY = useTransform(scrollY, [0, 900], [0, -180]);
  const gridOpacity = useTransform(scrollY, [0, 600], [1, 0.25]);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div className="absolute inset-0" style={{ y: glowY }}>
        {GLOWS.map((g) => (
          <motion.div
            key={g.color}
            className="absolute rounded-full"
            style={{
              left: g.left,
              top: g.top,
              width: g.size,
              height: g.size,
              background: `radial-gradient(circle at center, ${g.color}, transparent 66%)`,
              filter: "blur(48px)",
              willChange: "transform",
            }}
            animate={reduce ? undefined : { x: g.x, y: g.y, scale: [1, 1.08, 0.97] }}
            transition={{ duration: g.duration, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
          />
        ))}
      </motion.div>

      <motion.div className="absolute inset-x-[-30%] bottom-[-12%] h-[58%]" style={{ perspective: 520, opacity: gridOpacity }}>
        <motion.div
          className="absolute inset-0"
          style={{
            transform: "rotateX(64deg)",
            transformOrigin: "50% 0%",
            backgroundImage:
              "linear-gradient(rgba(124,92,255,0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(124,92,255,0.16) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse 60% 70% at 50% 0%, black 30%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(ellipse 60% 70% at 50% 0%, black 30%, transparent 75%)",
          }}
          animate={reduce ? undefined : { backgroundPositionY: ["0px", "56px"] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "linear" }}
        />
      </motion.div>

      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-canvas" />
    </div>
  );
}
