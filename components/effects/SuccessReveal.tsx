"use client";

import Box from "@mui/material/Box";
import { CheckIcon } from "@phosphor-icons/react";

/**
 * The "wow" moment after a real registration completes — three
 * concentric rings expanding outward from a glowing checkmark, staggered
 * so it reads as one continuous pulse rather than three separate rings.
 * Deliberately not confetti: this is meant to feel like a signal
 * activating (the agentic-internet metaphor — a node coming online), not
 * a party effect.
 */
export function SuccessReveal() {
  return (
    <Box sx={{ position: "relative", width: 72, height: 72, mx: "auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {[0, 0.5, 1].map((delay) => (
        <Box
          key={delay}
          className="animate-expand-ring"
          sx={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "1.5px solid",
            borderColor: "success.main",
            animationDelay: `${delay}s`,
          }}
        />
      ))}
      <Box
        sx={{
          position: "relative",
          width: 56,
          height: 56,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(58,217,183,0.12)",
          border: "1px solid",
          borderColor: "rgba(58,217,183,0.4)",
          boxShadow: "0 0 24px rgba(58,217,183,0.25)",
        }}
      >
        <Box component="span" sx={{ display: "inline-flex", color: "success.main" }}><CheckIcon size={28} weight="bold" aria-hidden /></Box>
      </Box>
    </Box>
  );
}
