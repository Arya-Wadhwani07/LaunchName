"use client";

import { Fragment } from "react";
import { motion, useReducedMotion } from "motion/react";
import { GlobeIcon, LightbulbIcon, RocketLaunchIcon, TagIcon, type Icon } from "@phosphor-icons/react";

const MILESTONES: { label: string; icon: Icon }[] = [
  { label: "Idea", icon: LightbulbIcon },
  { label: "Brand", icon: TagIcon },
  { label: "Domain", icon: GlobeIcon },
  { label: "Live", icon: RocketLaunchIcon },
];

const STEP = 0.32; // seconds between milestones lighting up
const START = 0.35;

/** The four milestones of a launch, lit in sequence on load like a progress tracker. */
export function Milestones() {
  const reduce = useReducedMotion();
  const at = (i: number) => (reduce ? 0 : START + i * STEP);

  return (
    <ol aria-label="Launch milestones: idea, brand, domain, live" className="flex items-start justify-center">
      {MILESTONES.map((m, i) => {
        const MIcon = m.icon;
        const last = i === MILESTONES.length - 1;
        return (
          <Fragment key={m.label}>
            {i > 0 && (
              <li aria-hidden className="relative mx-1 mt-[15px] h-[2px] w-8 overflow-hidden rounded-full bg-surface-border sm:mx-1.5 sm:w-14">
                <motion.span
                  className="absolute inset-0 origin-left rounded-full bg-gradient-to-r from-accent to-accent-soft"
                  initial={{ scaleX: reduce ? 1 : 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: STEP, delay: at(i) - STEP * 0.85, ease: "easeInOut" }}
                />
                {!reduce && (
                  <motion.span
                    className="absolute inset-y-0 w-4 bg-gradient-to-r from-transparent via-white/80 to-transparent"
                    initial={{ x: "-100%" }}
                    animate={{ x: "350%" }}
                    transition={{ duration: 1.1, delay: START + MILESTONES.length * STEP + i * 0.18, repeat: Infinity, repeatDelay: 2.6, ease: "easeInOut" }}
                  />
                )}
              </li>
            )}
            <li className="flex w-12 flex-col items-center gap-1.5 sm:w-14">
              <motion.span
                className="relative flex h-8 w-8 items-center justify-center rounded-full border"
                initial={reduce ? false : { scale: 0.5, opacity: 0, borderColor: "rgba(255,255,255,0.08)" }}
                animate={{
                  scale: 1,
                  opacity: 1,
                  borderColor: last ? "rgba(255,162,71,0.7)" : "rgba(124,92,255,0.6)",
                  backgroundColor: last ? "rgba(255,162,71,0.14)" : "rgba(124,92,255,0.14)",
                }}
                transition={{ type: "spring", bounce: 0.45, visualDuration: 0.35, delay: at(i) }}
                style={{ color: last ? "#ffc185" : "#a18aff" }}
              >
                <MIcon size={15} weight="duotone" aria-hidden />
                {last && !reduce && (
                  <motion.span
                    aria-hidden
                    className="absolute inset-0 rounded-full border border-accent2"
                    initial={{ scale: 1, opacity: 0 }}
                    animate={{ scale: [1, 1.9], opacity: [0.7, 0] }}
                    transition={{ duration: 1.6, delay: at(i) + 0.3, repeat: Infinity, ease: "easeOut" }}
                  />
                )}
              </motion.span>
              <motion.span
                className={`text-[11px] font-medium ${last ? "text-accent2-soft" : "text-ink-muted"}`}
                initial={reduce ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: at(i) + 0.1 }}
              >
                {m.label}
              </motion.span>
            </li>
          </Fragment>
        );
      })}
    </ol>
  );
}
