import { LogoMark } from "@/components/brand/LogoMark";
import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { AgentConnectConsole } from "@/features/agents/AgentConnectConsole";
import { PoweredByBadge } from "@/components/domain/PoweredBy";

export default function AgentConnectPage({ params }: { params: { domain: string } }) {
  const host = decodeURIComponent(params.domain);

  return (
    <Box component="main" sx={{ minHeight: "100vh" }}>
      <Box component="nav" sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: 960, mx: "auto", px: 3, py: 3 }}>
          <Box component={Link} href="/" sx={{ display: "flex", alignItems: "center", gap: 1, textDecoration: "none" }}>
            <LogoMark size={24} />
            <Typography sx={{ fontWeight: 600, color: "text.primary" }}>LaunchName</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
            <Typography component={Link} href={`/agents/${host}`} variant="mono" sx={{ fontSize: "0.8125rem", color: "text.secondary", textDecoration: "none", "&:hover": { color: "text.primary" } }}>
              {host}
            </Typography>
            <PoweredByBadge className="hidden sm:inline-flex" />
          </Box>
        </Box>
      </Box>
      <Box sx={{ maxWidth: 960, mx: "auto", px: 3, py: 8 }}>
        <Box sx={{ textAlign: "center", mb: 5 }}>
          <Typography variant="overline" sx={{ display: "block", mb: 1 }}>
            Agent-to-agent
          </Typography>
          <Typography variant="h1" sx={{ fontSize: { xs: "1.75rem", sm: "2.25rem" } }}>
            Agent Connect
          </Typography>
        </Box>
        <AgentConnectConsole host={host} />
      </Box>
    </Box>
  );
}
