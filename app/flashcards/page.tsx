import { LogoMark } from "@/components/brand/LogoMark";
import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { FlashcardDeck } from "@/features/flashcards/FlashcardDeck";
import { PoweredByBadge } from "@/components/domain/PoweredBy";

export const metadata = {
  title: "Flashcards - LaunchName",
  description: "The LaunchName story, one card at a time, including a live name.com check.",
};

export default function FlashcardsPage() {
  return (
    <Box component="main" sx={{ position: "relative", minHeight: "100vh", overflow: "hidden" }}>
      <Box className="bg-noise" sx={{ pointerEvents: "none", position: "absolute", inset: 0, opacity: 0.3 }} />
      <Box className="bg-mesh animate-drift" sx={{ pointerEvents: "none", position: "absolute", insetInline: 0, top: -200, height: 560 }} />

      <Box component="nav" sx={{ position: "relative", mx: "auto", maxWidth: 1152, display: "flex", alignItems: "center", justifyContent: "space-between", px: 3, py: 3 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <LogoMark size={24} />
          <Typography sx={{ fontWeight: 600, letterSpacing: "-0.01em" }}>LaunchName</Typography>
        </Link>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
          <Typography component={Link} href="/about" variant="body2" sx={{ display: { xs: "none", sm: "inline" }, color: "text.secondary", "&:hover": { color: "text.primary" } }}>
            About
          </Typography>
          <Typography component={Link} href="/dashboard" variant="body2" sx={{ color: "text.secondary", "&:hover": { color: "text.primary" } }}>
            Dashboard
          </Typography>
          <PoweredByBadge className="hidden sm:inline-flex" />
        </Box>
      </Box>

      <Box component="section" sx={{ position: "relative", mx: "auto", maxWidth: 768, px: 3, pb: 3, pt: 5, textAlign: "center" }}>
        <Typography
          className="animate-fade-up"
          sx={{ mb: 1.5, fontFamily: "mono", fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "secondary.light" }}
        >
          Flashcards
        </Typography>
        <Typography
          variant="h3"
          className="animate-fade-up text-balance"
          sx={{ fontWeight: 600, letterSpacing: "-0.01em", animationDelay: "60ms", fontSize: { xs: "1.875rem", sm: "2.25rem" } }}
        >
          The LaunchName story, one card at a time.
        </Typography>
        <Typography variant="body2" className="animate-fade-up" sx={{ mt: 1.5, color: "text.disabled", animationDelay: "120ms" }}>
          Click a card to flip it, use the arrows, or the ← → keys. Card 3 pulls a real, live result from name.com.
        </Typography>
      </Box>

      <Box component="section" sx={{ position: "relative", mx: "auto", maxWidth: 768, px: 3, pb: 12, pt: 3 }}>
        <FlashcardDeck />
      </Box>
    </Box>
  );
}
