"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Drawer } from "@/components/ui/overlay";
import { Badge } from "@/components/ui/primitives";

interface CapabilityStatus {
  key: string;
  label: string;
  complete: boolean;
  completedAt?: string;
  count: number;
}

interface DebugStatus {
  provider: { mode: "live" | "mock"; environment: string; baseUrl: string };
  brandGeneration: "live" | "mock";
  capabilities: CapabilityStatus[];
}

export function DebugDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [status, setStatus] = useState<DebugStatus | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const load = () => fetch("/api/debug/status").then((r) => r.json()).then((d) => !cancelled && setStatus(d));
    load();
    const interval = setInterval(load, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [open]);

  return (
    <Drawer open={open} onClose={onClose} title="Name.com API">
      {!status ? (
        <Typography variant="body2" sx={{ color: "text.disabled" }}>
          Loading…
        </Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Box>
            <Typography variant="overline" sx={{ mb: 1, display: "block", color: "text.disabled" }}>
              Provider
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}>
              <Badge variant={status.provider.mode === "live" ? "available" : "premium"}>
                {status.provider.mode === "live" ? "Live API" : "Mock mode"}
              </Badge>
              <Badge variant="neutral">{status.provider.environment}</Badge>
            </Box>
            <Typography sx={{ mt: 1, wordBreak: "break-all", fontFamily: "mono", fontSize: "0.6875rem", color: "text.disabled" }}>
              {status.provider.baseUrl}
            </Typography>
          </Box>

          <Box>
            <Typography variant="overline" sx={{ mb: 1, display: "block", color: "text.disabled" }}>
              Brand generation
            </Typography>
            <Badge variant={status.brandGeneration === "live" ? "available" : "premium"}>
              {status.brandGeneration === "live" ? "Claude" : "Offline generator"}
            </Badge>
          </Box>

          <Box>
            <Typography variant="overline" sx={{ mb: 1.5, display: "block", color: "text.disabled" }}>
              Capabilities exercised this session
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
              {status.capabilities.map((c) => (
                <Box
                  key={c.key}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderRadius: 1.5,
                    border: 1,
                    borderColor: "divider",
                    bgcolor: "background.default",
                    px: 1.5,
                    py: 1.25,
                  }}
                >
                  <Typography variant="body2">{c.label}</Typography>
                  {c.complete ? (
                    <Box component="span" sx={{ display: "flex", alignItems: "center", gap: 0.75, fontSize: "0.75rem", color: "success.main" }}>
                      ✓ Complete
                      <Box component="span" sx={{ color: "text.disabled" }}>
                        ({c.count})
                      </Box>
                    </Box>
                  ) : (
                    <Typography variant="caption" sx={{ color: "text.disabled" }}>
                      Not yet called
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
          </Box>

          <Typography variant="caption" sx={{ lineHeight: 1.6, color: "text.disabled" }}>
            Every domain, price, and DNS record in this app comes from a real request to the name.com Core API
            (or, if no credentials are configured, an isolated mock provider that mirrors it exactly). No
            secrets are shown here.
          </Typography>
        </Box>
      )}
    </Drawer>
  );
}
