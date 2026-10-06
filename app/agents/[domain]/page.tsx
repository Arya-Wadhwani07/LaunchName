import { LogoMark } from "@/components/brand/LogoMark";
import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { AgentProfile } from "@/features/agents/AgentProfile";
import { PoweredByBadge } from "@/components/domain/PoweredBy";

export default function AgentProfilePage({ params }: { params: { domain: string } }) {
  const host = decodeURIComponent(params.domain);

  return (
    <Box component="main" sx={{ minHeight: "100vh" }}>
      <Box component="nav" sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: 1152, mx: "auto", px: 3, py: 3 }}>
          <Box component={Link} href="/" sx={{ display: "flex", alignItems: "center", gap: 1, textDecoration: "none" }}>
            <LogoMark size={24} />
            <Typography sx={{ fontWeight: 600, color: "text.primary" }}>LaunchName</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
            <Typography component={Link} href="/agents" variant="body2" sx={{ color: "text.secondary", textDecoration: "none", "&:hover": { color: "text.primary" } }}>
              Agent Directory
            </Typography>
            <PoweredByBadge className="hidden sm:inline-flex" />
          </Box>
        </Box>
      </Box>
      <Box sx={{ maxWidth: 1152, mx: "auto", px: 3, py: 8 }}>
        <AgentProfile host={host} />
      </Box>
    </Box>
  );
}
