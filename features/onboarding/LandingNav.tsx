"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { ArrowRightIcon, BinocularsIcon, BookOpenTextIcon, CardsIcon, ListIcon, SquaresFourIcon, XIcon } from "@phosphor-icons/react";
import { LogoMark } from "@/components/brand/LogoMark";

const NAV = [
  { href: "/agents", label: "Agent Directory", icon: BinocularsIcon },
  { href: "/about", label: "How it works", icon: BookOpenTextIcon },
  { href: "/flashcards", label: "Flashcards", icon: CardsIcon },
  { href: "/dashboard", label: "Dashboard", icon: SquaresFourIcon },
] as const;

const SPRING = { type: "spring", bounce: 0.2, visualDuration: 0.3 } as const;

function focusIdeaInput() {
  const input = document.getElementById("idea-input");
  input?.scrollIntoView({ behavior: "smooth", block: "center" });
  input?.focus({ preventScroll: true });
}

export function LandingNav() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 24));

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ ...SPRING, delay: 0.05 }}
      className="fixed inset-x-0 top-3 z-50 px-3 sm:top-4"
    >
      <motion.nav
        aria-label="Main"
        animate={{
          backgroundColor: scrolled ? "rgba(14,13,17,0.78)" : "rgba(14,13,17,0.35)",
          borderColor: scrolled ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.06)",
          boxShadow: scrolled ? "0 12px 40px -12px rgba(0,0,0,0.7)" : "0 0 0 0 rgba(0,0,0,0)",
        }}
        transition={{ duration: 0.25 }}
        className="mx-auto flex max-w-[1120px] items-center justify-between gap-3 rounded-2xl border py-2 pl-3 pr-2 backdrop-blur-xl"
      >
        <Link href="/" className="group flex items-center gap-2.5 rounded-xl px-1.5 py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-soft">
          <motion.span whileHover={{ rotate: -12, scale: 1.06 }} whileTap={{ scale: 0.92 }} transition={SPRING} className="inline-flex">
            <LogoMark size={28} />
          </motion.span>
          <span className="text-[0.9375rem] font-semibold tracking-tight text-ink">LaunchName</span>
        </Link>

        <ul className="hidden items-center gap-0.5 md:flex" onMouseLeave={() => setHovered(null)}>
          {NAV.map((item, i) => {
            const Icon = item.icon;
            const active = hovered === i;
            return (
              <li key={item.href} className="relative">
                {active && (
                  <motion.span
                    layoutId="nav-hover"
                    transition={SPRING}
                    className="absolute inset-0 rounded-xl border border-white/10 bg-white/[0.06]"
                    aria-hidden
                  />
                )}
                <motion.div whileTap={{ scale: 0.95 }} transition={SPRING}>
                  <Link
                    href={item.href}
                    onMouseEnter={() => setHovered(i)}
                    onFocus={() => setHovered(i)}
                    onBlur={() => setHovered(null)}
                    className="relative flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium text-ink-muted transition-colors duration-150 hover:text-ink focus-visible:text-ink focus-visible:outline-none"
                  >
                    <motion.span animate={active ? { y: -1.5, rotate: -8, scale: 1.1 } : { y: 0, rotate: 0, scale: 1 }} transition={SPRING} className="inline-flex">
                      <Icon size={17} weight={active ? "duotone" : "regular"} aria-hidden />
                    </motion.span>
                    {item.label}
                  </Link>
                </motion.div>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-2">
          <motion.button
            type="button"
            onClick={focusIdeaInput}
            initial="rest"
            animate="rest"
            whileHover="hover"
            whileTap={{ scale: 0.96 }}
            className="relative hidden items-center gap-2 overflow-hidden rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-canvas shadow-[0_6px_20px_-8px_rgba(124,92,255,0.8)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-soft sm:inline-flex"
          >
            <motion.span
              aria-hidden
              variants={{ rest: { x: "-120%" }, hover: { x: "120%" } }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-none absolute inset-y-0 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/60 to-transparent"
            />
            <span className="relative">Start a launch</span>
            <motion.span variants={{ rest: { x: 0 }, hover: { x: 3 } }} transition={SPRING} className="relative inline-flex">
              <ArrowRightIcon size={15} weight="bold" aria-hidden />
            </motion.span>
          </motion.button>

          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-ink md:hidden"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={menuOpen ? "x" : "list"}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="inline-flex"
              >
                {menuOpen ? <XIcon size={20} aria-hidden /> : <ListIcon size={20} aria-hidden />}
              </motion.span>
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={SPRING}
            className="mx-auto mt-2 max-w-[1120px] rounded-2xl border border-white/10 bg-[rgba(14,13,17,0.92)] p-2 backdrop-blur-xl md:hidden"
          >
            <motion.ul initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.04 } } }}>
              {NAV.map((item) => {
                const Icon = item.icon;
                return (
                  <motion.li key={item.href} variants={{ hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } }}>
                    <Link
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-[0.9375rem] font-medium text-ink-muted active:bg-white/[0.06] hover:bg-white/[0.04] hover:text-ink"
                    >
                      <Icon size={20} weight="duotone" aria-hidden />
                      {item.label}
                    </Link>
                  </motion.li>
                );
              })}
              <motion.li variants={{ hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } }} className="p-1 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    focusIdeaInput();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-canvas"
                >
                  Start a launch <ArrowRightIcon size={15} weight="bold" aria-hidden />
                </button>
              </motion.li>
            </motion.ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
