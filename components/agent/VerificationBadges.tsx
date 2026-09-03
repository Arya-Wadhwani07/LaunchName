import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CheckIcon from "@mui/icons-material/Check";
import RemoveIcon from "@mui/icons-material/Remove";
import type { AgentVerificationState } from "@/lib/agents/types";

interface Row {
  label: string;
  done: boolean;
  note?: string;
}

/**
 * Deliberately shows four separate states rather than one "verified"
 * badge — discovery never implies trust. Each row is only checked when
 * LaunchName actually ran that specific check (see lib/agents/verification.ts).
 * There is no cryptographic-identity row because this build doesn't
 * implement one.
 */
export function VerificationBadges({ verification }: { verification: AgentVerificationState }) {
  const rows: Row[] = [
    { label: "Domain ownership verified", done: verification.domainOwnershipVerified, note: "Confirmed by reading the discovery TXT record back through name.com's DNS API." },
    { label: "Agent identity declared", done: verification.identityDeclared, note: "Name, description, capabilities, and endpoint are all present." },
    { label: "LaunchName gateway configured", done: verification.gatewayConfigured, note: "Always-on stand-in endpoint, live regardless of the domain's own DNS." },
    { label: "Publicly reachable", done: verification.publiclyReachable, note: verification.reachabilityNote },
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
      {rows.map((r) => (
        <Box
          key={r.label}
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 1.5,
            borderRadius: 1.5,
            border: 1,
            borderColor: "divider",
            backgroundColor: "background.paper",
            px: 1.75,
            py: 1.25,
          }}
        >
          <Box
            sx={{
              mt: 0.25,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 20,
              height: 20,
              flexShrink: 0,
              borderRadius: "50%",
              border: 1,
              borderColor: r.done ? "rgba(61,220,151,0.4)" : "divider",
              backgroundColor: r.done ? "rgba(61,220,151,0.1)" : "transparent",
              color: r.done ? "success.main" : "text.disabled",
            }}
          >
            {r.done ? <CheckIcon sx={{ fontSize: 13 }} /> : <RemoveIcon sx={{ fontSize: 12 }} />}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ color: r.done ? "text.primary" : "text.secondary" }}>
              {r.label}
            </Typography>
            {r.note && (
              <Typography variant="caption" component="div" sx={{ mt: 0.25 }}>
                {r.note}
              </Typography>
            )}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
