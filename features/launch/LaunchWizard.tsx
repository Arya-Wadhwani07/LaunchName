"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import { LaunchProvider, useLaunch } from "@/context/LaunchContext";
import { BrandStep } from "@/features/brand-discovery/BrandStep";
import { AgentCapabilityStep } from "@/features/agents/AgentCapabilityStep";
import { DomainDiscoveryStep } from "@/features/domains/DomainDiscoveryStep";
import { DomainDecisionStep } from "@/features/domains/DomainDecisionStep";
import { RegistrationStep } from "@/features/registration/RegistrationStep";
import { LaunchCenterStep } from "@/features/launch/LaunchCenterStep";
import { PoweredByBadge } from "@/components/domain/PoweredBy";
import type { WizardStep } from "@/context/LaunchContext";

const STEP_LABELS: { key: WizardStep; label: string }[] = [
  { key: "brands", label: "Brand" },
  { key: "capabilities", label: "Agent" },
  { key: "domains", label: "Domain" },
  { key: "decision", label: "Confirm" },
  { key: "registering", label: "Register" },
  { key: "launch", label: "Launch" },
];

function TopBar() {
  const { state } = useLaunch();
  const activeIndex = STEP_LABELS.findIndex((s) => s.key === state.step);

  return (
    <Box
      component="header"
      sx={{ position: "sticky", top: 0, zIndex: (t) => t.zIndex.appBar, borderBottom: 1, borderColor: "divider", backgroundColor: "rgba(8,8,13,0.85)", backdropFilter: "blur(10px)" }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: 1024, mx: "auto", px: 3, py: 1.5, gap: 3 }}>
        <Box component={Link} href="/" sx={{ display: "flex", alignItems: "center", gap: 1, textDecoration: "none", flexShrink: 0 }}>
          <Box sx={{ width: 20, height: 20, borderRadius: 0.75, background: "linear-gradient(135deg, #7c5cff, #5b3fd6)" }} />
          <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>
            LaunchName
          </Typography>
        </Box>

        <Stepper activeStep={activeIndex} sx={{ display: { xs: "none", sm: "flex" }, flex: 1, maxWidth: 560 }}>
          {STEP_LABELS.map((s) => (
            <Step key={s.key}>
              <StepLabel>{s.label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <PoweredByBadge className="hidden sm:inline-flex" />
      </Box>
    </Box>
  );
}

function WizardBody() {
  const { state, dispatch } = useLaunch();
  const searchParams = useSearchParams();

  useEffect(() => {
    const idea = searchParams.get("idea");
    const demo = searchParams.get("demo") === "1";
    if (idea && !state.idea) {
      dispatch({ type: "SET_IDEA", idea, demoMode: demo });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  if (!state.idea) {
    return (
      <Box sx={{ display: "flex", minHeight: "60vh", alignItems: "center", justifyContent: "center", px: 3, textAlign: "center" }}>
        <Typography variant="body2">
          Missing an idea to launch from,{" "}
          <Box component={Link} href="/" sx={{ color: "primary.light", textDecoration: "underline", textUnderlineOffset: "3px" }}>
            start over
          </Box>
          .
        </Typography>
      </Box>
    );
  }

  switch (state.step) {
    case "idea":
    case "brands":
      return <BrandStep />;
    case "capabilities":
      return <AgentCapabilityStep onContinue={() => dispatch({ type: "SET_STEP", step: "domains" })} />;
    case "domains":
      return <DomainDiscoveryStep />;
    case "decision":
      return <DomainDecisionStep onSecure={() => dispatch({ type: "SET_STEP", step: "registering" })} />;
    case "registering":
      return <RegistrationStep />;
    case "launch":
      return <LaunchCenterStep />;
    default:
      return null;
  }
}

export function LaunchWizard() {
  return (
    <LaunchProvider>
      <TopBar />
      <WizardBody />
    </LaunchProvider>
  );
}
