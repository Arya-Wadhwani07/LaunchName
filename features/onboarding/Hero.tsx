"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import { Button } from "@/components/ui/primitives";
import { AuroraBackground } from "@/components/effects/AuroraBackground";
import { ArrowRightIcon, PlayCircleIcon, CardsIcon } from "@phosphor-icons/react";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { Milestones } from "./Milestones";
import { LandingNav } from "./LandingNav";
import { DnsLookupScene } from "./DnsLookupScene";

const SPRING = { type: "spring", bounce: 0.2, visualDuration: 0.4 } as const;
const heroContainer: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } } };
const heroItem: Variants = {
  hidden: { opacity: 0, y: 18, filter: "blur(6px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

const CHIPS = ["AI fitness coach", "College marketplace", "Developer SaaS", "Creator brand"];
const DEMO_IDEA = "An AI-powered study planner for college students";

const TYPED_IDEAS = [
  "An AI fitness coach for marathon runners",
  "A marketplace for used college textbooks",
  "A code review bot for small dev teams",
  "A meal planner for busy parents",
];

/** Types example ideas into the placeholder until the user focuses or types. */
function useTypedPlaceholder(active: boolean) {
  const reduce = useReducedMotion();
  const [text, setText] = useState("");
  useEffect(() => {
    if (!active || reduce) return;
    let idea = 0;
    let chars = 0;
    let deleting = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const full = TYPED_IDEAS[idea];
      if (!deleting) {
        chars += 1;
        setText(full.slice(0, chars));
        if (chars === full.length) {
          deleting = true;
          timer = setTimeout(tick, 1700);
          return;
        }
        timer = setTimeout(tick, 38 + Math.random() * 40);
      } else {
        chars -= 1;
        setText(full.slice(0, chars));
        if (chars === 0) {
          deleting = false;
          idea = (idea + 1) % TYPED_IDEAS.length;
          timer = setTimeout(tick, 350);
          return;
        }
        timer = setTimeout(tick, 18);
      }
    };
    timer = setTimeout(tick, 1400);
    return () => clearTimeout(timer);
  }, [active, reduce]);
  return active && !reduce ? text : "";
}

const UNDERSTANDING_STAGES = ["Understanding your idea…", "Exploring naming directions…", "Checking domain possibilities…"];

export function Hero() {
  const router = useRouter();
  const [idea, setIdea] = useState("");
  const [stage, setStage] = useState<number | null>(null);
  const [focused, setFocused] = useState(false);
  const typed = useTypedPlaceholder(!focused && idea === "");

  function start(value: string, demo = false) {
    const trimmed = value.trim();
    if (!trimmed || stage !== null) return;

    // A brief, intentional transition — not fake progress on a real
    // operation (nothing here claims an API call happened), just a beat
    // that makes "idea → brand" feel like a considered step rather than
    // an instant page swap.
    setStage(0);
    let i = 0;
    const advance = () => {
      i += 1;
      if (i < UNDERSTANDING_STAGES.length) {
        setStage(i);
        setTimeout(advance, 620);
      } else {
        const params = new URLSearchParams({ idea: trimmed });
        if (demo) params.set("demo", "1");
        router.push(`/launch?${params.toString()}`);
      }
    };
    setTimeout(advance, 620);
  }

  return (
    <Box sx={{ position: "relative", overflowX: "clip" }}>
      <LandingNav />
      <Box sx={{ position: "relative" }}>
      <Box className="bg-noise" sx={{ position: "absolute", inset: 0, opacity: 0.35, pointerEvents: "none" }} />
      <AuroraBackground />

      <Box
        component="section"
        sx={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          maxWidth: 720,
          mx: "auto",
          px: 3,
          pb: { xs: 4, sm: 6 },
          pt: { xs: 25, sm: 24 },
          textAlign: "center",
        }}
      >
        <motion.div variants={heroContainer} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
        <motion.div variants={heroItem} style={{ marginBottom: 28 }}>
          <Milestones />
        </motion.div>
        <motion.div variants={heroItem}>
        <Typography variant="display" component="h1" className="text-balance" sx={{ color: "text.primary" }}>
          Your next idea deserves a{" "}
          <motion.span
            style={{ display: "inline-block", backgroundImage: "linear-gradient(90deg, #a18aff, #7c5cff, #ffa247, #a18aff)", backgroundSize: "300% 100%", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}
            animate={{ backgroundPosition: ["0% 50%", "100% 50%"] }}
            transition={{ duration: 8, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
          >
            home
          </motion.span>
          .
        </Typography>
        </motion.div>
        <motion.div variants={heroItem}>
        <Typography variant="subtitle1" className="text-balance" sx={{ mt: 2.5, maxWidth: 560, fontSize: "1.125rem" }}>
          Find the right domain, establish your agent identity, and become discoverable on the agentic internet.
        </Typography>
        </motion.div>

        <motion.div variants={heroItem} style={{ width: "100%", maxWidth: 560, marginTop: 40 }}>
          {stage === null ? (
            <>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  gap: 1,
                  p: 1,
                  borderRadius: 3,
                  border: 1,
                  borderColor: "divider",
                  backgroundColor: "rgba(14,13,17,0.72)",
                  backdropFilter: "blur(12px)",
                  transition: "border-color 150ms ease, box-shadow 200ms ease",
                  "&:hover": { borderColor: "rgba(255,255,255,0.14)" },
                  "&:focus-within": { borderColor: "primary.main", boxShadow: "0 0 0 4px rgba(124,92,255,0.18), 0 20px 50px -20px rgba(124,92,255,0.6)" },
                }}
              >
                <TextField
                  id="idea-input"
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && start(idea)}
                  placeholder={typed ? `${typed}▍` : "What are you building?"}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  variant="standard"
                  fullWidth
                  slotProps={{ input: { disableUnderline: true, sx: { fontSize: "0.9375rem", px: 1.5, height: 48 } }, htmlInput: { "aria-label": "What are you building?" } }}
                  sx={{ flex: 1 }}
                />
                <Button size="lg" onClick={() => start(idea)} disabled={!idea.trim()} endIcon={<ArrowRightIcon size={20} aria-hidden />} sx={{ flexShrink: 0 }}>
                  Start my launch
                </Button>
              </Box>

              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "center", mt: 2.5, rowGap: 1 }}>
                {CHIPS.map((chip) => (
                  <motion.span key={chip} whileHover={{ y: -2, scale: 1.04 }} whileTap={{ scale: 0.95 }} transition={SPRING} style={{ display: "inline-flex" }}>
                    <Chip
                      label={chip}
                      size="small"
                      variant="outlined"
                      onClick={() => setIdea(chip)}
                      sx={{
                        color: idea === chip ? "primary.light" : "text.secondary",
                        borderColor: idea === chip ? "rgba(124,92,255,0.55)" : "divider",
                        backgroundColor: "rgba(14,13,17,0.5)",
                        transition: "border-color 150ms ease, color 150ms ease",
                        "&:hover": { borderColor: "rgba(124,92,255,0.45)", color: "text.primary", backgroundColor: "rgba(124,92,255,0.08) !important" },
                      }}
                    />
                  </motion.span>
                ))}
              </Box>

              <Box sx={{ display: "flex", gap: 2, justifyContent: "center", alignItems: "center", mt: 3 }}>
                <motion.button
                  type="button"
                  onClick={() => start(DEMO_IDEA, true)}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.96 }}
                  transition={SPRING}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-ink-muted transition-colors hover:bg-white/[0.05] hover:text-accent-soft"
                >
                  <PlayCircleIcon size={15} weight="duotone" aria-hidden /> Try the demo
                </motion.button>
                <motion.a
                  href="/flashcards"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.96 }}
                  transition={SPRING}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-ink-muted transition-colors hover:bg-white/[0.05] hover:text-accent2-soft"
                >
                  <CardsIcon size={15} weight="duotone" aria-hidden /> Explore in flashcards
                </motion.a>
              </Box>
            </>
          ) : (
            <Box className="animate-fade-in" sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, py: 3 }}>
              <CircularProgress size={22} thickness={4.5} sx={{ color: "primary.main" }} />
              <Typography key={stage} variant="body1" className="animate-fade-up" sx={{ color: "text.secondary" }}>
                {UNDERSTANDING_STAGES[stage]}
              </Typography>
            </Box>
          )}
        </motion.div>
        </motion.div>
      </Box>
      </Box>

      <DnsLookupScene />

      <Box component="section" sx={{ position: "relative", borderTop: 1, borderColor: "divider", backgroundColor: "rgba(14,13,17,0.4)" }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" },
            gap: 5,
            maxWidth: 1024,
            mx: "auto",
            px: 3,
            py: 8,
          }}
        >
          {[
            { eyebrow: "01", title: "Most domain tools stop at search.", body: "You get a list of available names and are left on your own for everything after." },
            { eyebrow: "02", title: "LaunchName doesn't.", body: "Describe an idea. Find the right identity. Secure the domain. Configure the infrastructure. Launch." },
            { eyebrow: "03", title: "One flow, real infrastructure.", body: "Every domain, price, and DNS record comes from a live call to name.com, not a mockup." },
            {
              eyebrow: "04",
              title: "Domains are learning a second job.",
              body: "Today they tell humans where to find you. LaunchName lets the same domain and DNS infrastructure tell AI agents who you are, what you can do, and how to reach you.",
            },
          ].map((s, i) => (
            <motion.div
              key={s.eyebrow}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -4 }}
              className="rounded-2xl border border-transparent p-4 transition-colors duration-200 hover:border-surface-border hover:bg-white/[0.02]"
            >
              <Typography variant="overline" sx={{ display: "block", mb: 1.5 }}>
                {s.eyebrow}
              </Typography>
              <Typography variant="h6" sx={{ mb: 1 }}>
                {s.title}
              </Typography>
              <Typography variant="body2">{s.body}</Typography>
            </motion.div>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
