"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { Button } from "@/components/ui/primitives";
import { Skeleton } from "@/components/ui/data";

interface Card {
  key: string;
  eyebrow: string;
  front: string;
  backTitle: string;
  back: string;
  power?: "name.com" | "Claude" | "LaunchName";
  live?: boolean;
}

const CARDS: Card[] = [
  {
    key: "hook",
    eyebrow: "01",
    front: "What if a domain search actually finished the job?",
    backTitle: "Most tools stop at \"available.\"",
    back: "LaunchName keeps going: brand → domain → registration → DNS → optionally, a discoverable AI agent. One flow, real infrastructure at every step.",
  },
  {
    key: "brand",
    eyebrow: "02",
    front: "“An AI study planner for college students”",
    backTitle: "Becomes StudyPilot, ClassFlow, LearnLoop…",
    back: "Claude drafts a handful of brandable names with a reason behind each one, a naming-agency pass, not a word-mashup generator.",
    power: "Claude",
  },
  {
    key: "live",
    eyebrow: "03",
    front: "Is studypilot.dev actually available?",
    backTitle: "Live from name.com, right now",
    back: "",
    power: "name.com",
    live: true,
  },
  {
    key: "register",
    eyebrow: "04",
    front: "How does “secure this domain” actually work?",
    backTitle: "A real Core API purchase call",
    back: "A fresh availability re-check, then POST /core/v1/domains with an idempotency key so a retried request can't double-purchase. Run against name.com's sandbox here, production-ready with one env var.",
    power: "name.com",
  },
  {
    key: "dns",
    eyebrow: "05",
    front: "Who wires up the DNS?",
    backTitle: "LaunchName does, through name.com",
    back: "A, CNAME, and TXT records are created automatically via the same Core API, validated server-side first, editable afterward in a friendly or advanced view.",
    power: "name.com",
  },
  {
    key: "agent-identity",
    eyebrow: "06",
    front: "Can a domain have an identity for AI agents, too?",
    backTitle: "Yes, an agent manifest, bound to the domain",
    back: "Name, capabilities, protocol, endpoint: a structured record inspired by real DNS-based agent discovery research (DNS-AID, ANS), not an invented standard.",
    power: "LaunchName",
  },
  {
    key: "verify",
    eyebrow: "07",
    front: "How does an agent prove it owns its domain?",
    backTitle: "By reading its own DNS back",
    back: "LaunchName writes a discovery marker as a TXT record via name.com, then reads it back to confirm: a genuine check, not a badge that just appears.",
    power: "name.com",
  },
  {
    key: "connect",
    eyebrow: "08",
    front: "Can two agents actually talk to each other?",
    backTitle: "Discover → verify → connect → respond",
    back: "A visible handshake, then a real Claude-generated reply in character as the agent. Demo and live paths are always labeled, never blurred together.",
    power: "Claude",
  },
];

const POWER_SX: Record<string, { color: string; borderColor: string; bgcolor: string }> = {
  "name.com": { color: "success.main", borderColor: "rgba(61,220,151,0.3)", bgcolor: "rgba(61,220,151,0.1)" },
  Claude: { color: "secondary.light", borderColor: "rgba(255,92,173,0.3)", bgcolor: "rgba(255,92,173,0.1)" },
  LaunchName: { color: "primary.light", borderColor: "rgba(124,92,255,0.3)", bgcolor: "rgba(124,92,255,0.1)" },
};

function LiveDomainCheck() {
  const [state, setState] = useState<"loading" | "done" | "error">("loading");
  const [result, setResult] = useState<{ domainName: string; purchasable: boolean; price?: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/domains/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brandName: "studypilot" }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const hit = (data.results ?? []).find((r: any) => r.domainName === "studypilot.dev") ?? data.results?.[0];
        if (!hit) throw new Error("no result");
        setResult({ domainName: hit.domainName, purchasable: hit.purchasable, price: hit.purchasePrice });
        setState("done");
      })
      .catch(() => !cancelled && setState("error"));
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "loading") {
    return <Skeleton className="h-16 w-full" />;
  }
  if (state === "error" || !result) {
    return (
      <Typography variant="body2" sx={{ color: "text.disabled" }}>
        Couldn&apos;t reach name.com just now. This card normally shows a live result.
      </Typography>
    );
  }
  return (
    <Box sx={{ borderRadius: 1.5, border: 1, borderColor: "divider", bgcolor: "background.default", px: 2, py: 1.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography sx={{ fontFamily: "mono", fontSize: "0.875rem" }}>{result.domainName}</Typography>
        <Chip
          label={result.purchasable ? "Available" : "Taken"}
          size="small"
          sx={
            result.purchasable
              ? { color: "success.main", borderColor: "rgba(61,220,151,0.3)", bgcolor: "rgba(61,220,151,0.1)", border: "1px solid", fontSize: "0.625rem", textTransform: "uppercase" }
              : { color: "text.disabled", border: "1px solid", borderColor: "divider", fontSize: "0.625rem", textTransform: "uppercase" }
          }
        />
      </Box>
      {result.purchasable && result.price && (
        <Typography variant="caption" sx={{ mt: 0.5, display: "block", color: "text.disabled" }}>
          ${result.price.toFixed(2)}/yr, checked just now, live
        </Typography>
      )}
    </Box>
  );
}

export function FlashcardDeck() {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const card = CARDS[index];
  const isLast = index === CARDS.length - 1;

  function go(delta: number) {
    setFlipped(false);
    setIndex((i) => Math.max(0, Math.min(CARDS.length - 1, i + delta)));
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === " ") {
        e.preventDefault();
        setFlipped((f) => !f);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 0.75 }}>
        {CARDS.map((c, i) => (
          <Box
            key={c.key}
            component="button"
            onClick={() => {
              setFlipped(false);
              setIndex(i);
            }}
            aria-label={`Go to card ${i + 1}`}
            sx={{
              height: 6,
              borderRadius: 999,
              width: i === index ? 24 : 6,
              bgcolor: i === index ? "primary.main" : "divider",
              transition: "all 300ms",
              cursor: "pointer",
              border: "none",
              p: 0,
              "&:hover": { bgcolor: i === index ? "primary.main" : "text.disabled" },
            }}
          />
        ))}
      </Box>

      <Box className="flip-scene" sx={{ height: 380, width: "100%", maxWidth: 448, "@media (min-width:600px)": { height: 360 } }}>
        <Box
          className={`flip-card${flipped ? " is-flipped" : ""}`}
          sx={{ position: "relative", height: "100%", width: "100%", cursor: "pointer" }}
          onClick={() => setFlipped((f) => !f)}
        >
          {/* Front */}
          <Box
            className="flip-face"
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              borderRadius: 4,
              border: 1,
              borderColor: "divider",
              bgcolor: "background.paper",
              p: 3.5,
              boxShadow: 3,
            }}
          >
            <Typography sx={{ fontFamily: "mono", fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "secondary.light" }}>
              {card.eyebrow} · Tap to flip
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 600, lineHeight: 1.3, letterSpacing: "-0.01em" }}>
              {card.front}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.disabled" }}>
              ↻ Flip for the answer
            </Typography>
          </Box>
          {/* Back */}
          <Box
            className="flip-face flip-face-back"
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              borderRadius: 4,
              border: "1px solid rgba(124,92,255,0.3)",
              bgcolor: "background.default",
              p: 3.5,
              boxShadow: 3,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              {card.power ? (
                <Chip
                  label={`Powered by ${card.power}`}
                  size="small"
                  sx={{ textTransform: "uppercase", fontSize: "0.625rem", letterSpacing: "0.04em", border: "1px solid", ...POWER_SX[card.power] }}
                />
              ) : (
                <span />
              )}
              <Typography variant="caption" sx={{ color: "text.disabled" }}>
                ↻ Tap to flip back
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600, letterSpacing: "-0.01em" }}>
                {card.backTitle}
              </Typography>
              {card.live ? (
                <Box onClick={(e) => e.stopPropagation()}>
                  <LiveDomainCheck />
                </Box>
              ) : (
                <Typography variant="body2" sx={{ lineHeight: 1.7, color: "text.secondary" }}>
                  {card.back}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      <Box sx={{ mt: 4, display: "flex", alignItems: "center", gap: 1.5 }}>
        <IconButton onClick={() => go(-1)} disabled={index === 0} aria-label="Previous card" sx={{ border: 1, borderColor: "divider" }}>
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <Typography variant="caption" sx={{ width: 64, textAlign: "center", color: "text.disabled" }}>
          {index + 1} / {CARDS.length}
        </Typography>
        <IconButton onClick={() => go(1)} disabled={isLast} aria-label="Next card" sx={{ border: 1, borderColor: "divider" }}>
          <ArrowForwardIcon fontSize="small" />
        </IconButton>
      </Box>

      {isLast && (
        <Box className="animate-fade-up" sx={{ mt: 5, display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5, textAlign: "center" }}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            That&apos;s the whole story. Ready to see it with your own idea?
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 1.5 }}>
            <Link href="/launch?idea=An%20AI-powered%20study%20planner%20for%20college%20students&demo=1">
              <Button size="lg">Try the demo →</Button>
            </Link>
            <Link href="/about">
              <Button size="lg" variant="secondary">
                See the full diagram
              </Button>
            </Link>
          </Box>
        </Box>
      )}
    </Box>
  );
}
