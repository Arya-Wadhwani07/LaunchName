"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { Button } from "@/components/ui/primitives";
import { PoweredByBadge } from "@/components/domain/PoweredBy";
import { NetworkBackground } from "@/components/effects/NetworkBackground";

const CHIPS = ["AI fitness coach", "College marketplace", "Developer SaaS", "Creator brand"];
const DEMO_IDEA = "An AI-powered study planner for college students";

const UNDERSTANDING_STAGES = ["Understanding your idea…", "Exploring naming directions…", "Checking domain possibilities…"];

export function Hero() {
  const router = useRouter();
  const [idea, setIdea] = useState("");
  const [stage, setStage] = useState<number | null>(null);

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
    <Box sx={{ position: "relative", overflow: "hidden" }}>
      <Box className="bg-noise" sx={{ position: "absolute", inset: 0, opacity: 0.4, pointerEvents: "none" }} />
      <NetworkBackground className="pointer-events-none" />
      <Box className="bg-mesh" sx={{ position: "absolute", inset: "-220px 0 auto 0", height: 640, pointerEvents: "none" }} />

      <Box
        component="nav"
        sx={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: 1152, mx: "auto", px: 3, py: 3 }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box sx={{ width: 24, height: 24, borderRadius: 1, background: "linear-gradient(135deg, #7c5cff, #5b3fd6)", boxShadow: (t) => t.shadows[2] }} />
          <Typography sx={{ fontWeight: 600, letterSpacing: "-0.01em" }}>LaunchName</Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
          <Typography component="a" href="/agents" variant="body2" sx={{ display: { xs: "none", sm: "block" }, color: "text.secondary", textDecoration: "none", "&:hover": { color: "text.primary" } }}>
            Agent Directory
          </Typography>
          <Typography component="a" href="/about" variant="body2" sx={{ display: { xs: "none", sm: "block" }, color: "text.secondary", textDecoration: "none", "&:hover": { color: "text.primary" } }}>
            About
          </Typography>
          <Typography component="a" href="/dashboard" variant="body2" sx={{ color: "text.secondary", textDecoration: "none", "&:hover": { color: "text.primary" } }}>
            Dashboard
          </Typography>
          <PoweredByBadge className="hidden sm:inline-flex" />
        </Box>
      </Box>

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
          pb: { xs: 12, sm: 16 },
          pt: { xs: 8, sm: 12 },
          textAlign: "center",
        }}
      >
        <Chip
          label="Idea → brand → domain → live, in one flow"
          size="small"
          variant="outlined"
          className="animate-fade-up"
          sx={{ mb: 3, color: "text.secondary", borderColor: "divider" }}
        />
        <Typography variant="display" component="h1" className="animate-fade-up text-balance" sx={{ color: "text.primary", animationDelay: "60ms" }}>
          Your next idea deserves a{" "}
          <Box component="span" sx={{ background: "linear-gradient(90deg, #a98bff, #7c5cff, #ff5cad)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
            home
          </Box>
          .
        </Typography>
        <Typography
          variant="subtitle1"
          className="animate-fade-up text-balance"
          sx={{ mt: 2.5, maxWidth: 560, fontSize: "1.125rem", animationDelay: "120ms" }}
        >
          Find the right domain, establish your agent identity, and become discoverable on the agentic internet.
        </Typography>

        <Box className="animate-fade-up" sx={{ mt: 5, width: "100%", maxWidth: 560, animationDelay: "180ms" }}>
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
                  backgroundColor: "background.paper",
                  transition: "border-color 150ms ease",
                  "&:focus-within": { borderColor: "primary.main" },
                }}
              >
                <TextField
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && start(idea)}
                  placeholder="What are you building?"
                  variant="standard"
                  fullWidth
                  slotProps={{ input: { disableUnderline: true, sx: { fontSize: "0.9375rem", px: 1.5, height: 48 } } }}
                  sx={{ flex: 1 }}
                />
                <Button size="lg" onClick={() => start(idea)} disabled={!idea.trim()} endIcon={<ArrowForwardIcon />} sx={{ flexShrink: 0 }}>
                  Start my launch
                </Button>
              </Box>

              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "center", mt: 2.5, rowGap: 1 }}>
                {CHIPS.map((chip) => (
                  <Chip
                    key={chip}
                    label={chip}
                    size="small"
                    variant="outlined"
                    onClick={() => setIdea(chip)}
                    sx={{
                      color: "text.secondary",
                      borderColor: "divider",
                      transition: "border-color 150ms ease, color 150ms ease",
                      "&:hover": { borderColor: "rgba(124,92,255,0.4)", color: "text.primary" },
                    }}
                  />
                ))}
              </Box>

              <Box sx={{ display: "flex", gap: 2, justifyContent: "center", alignItems: "center", mt: 3 }}>
                <Typography
                  component="button"
                  onClick={() => start(DEMO_IDEA, true)}
                  variant="caption"
                  sx={{ background: "none", border: "none", cursor: "pointer", textDecoration: "underline dotted", textUnderlineOffset: "4px", "&:hover": { color: "primary.light" } }}
                >
                  Or try the demo →
                </Typography>
                <Typography variant="caption" sx={{ color: "text.disabled" }}>
                  ·
                </Typography>
                <Typography
                  component="a"
                  href="/flashcards"
                  variant="caption"
                  sx={{ textDecoration: "underline dotted", textUnderlineOffset: "4px", "&:hover": { color: "secondary.light" } }}
                >
                  Explore in flashcards →
                </Typography>
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
        </Box>
      </Box>

      <Box component="section" sx={{ position: "relative", borderTop: 1, borderColor: "divider", backgroundColor: "rgba(18,18,24,0.4)" }}>
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
            <Box key={s.eyebrow} className="stagger-item" style={{ "--stagger-index": i } as React.CSSProperties}>
              <Typography variant="overline" sx={{ display: "block", mb: 1.5 }}>
                {s.eyebrow}
              </Typography>
              <Typography variant="h6" sx={{ mb: 1 }}>
                {s.title}
              </Typography>
              <Typography variant="body2">{s.body}</Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
