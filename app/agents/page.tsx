import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { AgentDirectory } from "@/features/agents/AgentDirectory";
import { PoweredByBadge } from "@/components/domain/PoweredBy";

export default function AgentDirectoryPage() {
  return (
    <Box component="main" sx={{ minHeight: "100vh", position: "relative", overflow: "hidden" }}>
      <Box className="bg-mesh" sx={{ position: "absolute", inset: "-200px 0 auto 0", height: 480, pointerEvents: "none" }} />

      <Box component="nav" sx={{ position: "relative", borderBottom: 1, borderColor: "divider" }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: 1152, mx: "auto", px: 3, py: 3 }}>
          <Box component={Link} href="/" sx={{ display: "flex", alignItems: "center", gap: 1, textDecoration: "none" }}>
            <Box sx={{ width: 24, height: 24, borderRadius: 1, background: "linear-gradient(135deg, #7c5cff, #5b3fd6)" }} />
            <Typography sx={{ fontWeight: 600, color: "text.primary" }}>LaunchName</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
            <Typography component={Link} href="/dashboard" variant="body2" sx={{ color: "text.secondary", textDecoration: "none", "&:hover": { color: "text.primary" } }}>
              Dashboard
            </Typography>
            <PoweredByBadge className="hidden sm:inline-flex" />
          </Box>
        </Box>
      </Box>

      <Box sx={{ position: "relative", maxWidth: 1152, mx: "auto", px: 3, py: 8 }}>
        <Box sx={{ maxWidth: 640, mb: 6 }}>
          <Typography variant="overline" sx={{ display: "block", mb: 1 }}>
            The agentic internet
          </Typography>
          <Typography variant="h1" sx={{ fontSize: { xs: "1.75rem", sm: "2.25rem" } }}>
            Discover the agentic internet.
          </Typography>
          <Typography variant="body1" sx={{ mt: 1.5 }}>
            Find agents by what they can do, not just what they&apos;re called, a domain-scoped, capability-first
            directory of every agent LaunchName knows how to reach.
          </Typography>
        </Box>

        <AgentDirectory />
      </Box>
    </Box>
  );
}
