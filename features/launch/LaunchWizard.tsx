"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepButton from "@mui/material/StepButton";
import StepLabel from "@mui/material/StepLabel";
import Tooltip from "@mui/material/Tooltip";
import CircularProgress from "@mui/material/CircularProgress";
import { LogoMark } from "@/components/brand/LogoMark";
import { LaunchProvider, useLaunch, canNavigateTo, isLocked, stepIndex, EDITABLE_STEPS } from "@/context/LaunchContext";
import { BrandStep } from "@/features/brand-discovery/BrandStep";
import { AgentCapabilityStep } from "@/features/agents/AgentCapabilityStep";
import { DomainDiscoveryStep } from "@/features/domains/DomainDiscoveryStep";
import { DomainDecisionStep } from "@/features/domains/DomainDecisionStep";
import { RegistrationStep } from "@/features/registration/RegistrationStep";
import { LaunchCenterStep } from "@/features/launch/LaunchCenterStep";
import { PoweredByBadge } from "@/components/domain/PoweredBy";
import { Button } from "@/components/ui/primitives";
import type { WizardStep } from "@/context/LaunchContext";
import { ArrowLeftIcon } from "@phosphor-icons/react";

const STEP_LABELS: { key: WizardStep; label: string }[] = [
  { key: "brands", label: "Brand" },
  { key: "capabilities", label: "Agent" },
  { key: "domains", label: "Domain" },
  { key: "decision", label: "Confirm" },
  { key: "registering", label: "Register" },
  { key: "launch", label: "Launch" },
];

const LABEL_OF: Record<string, string> = Object.fromEntries(STEP_LABELS.map((s) => [s.key, s.label]));

/** The step a "Back" control returns to, or null where Back would leave the wizard or undo a purchase. */
export function previousStep(step: WizardStep): WizardStep | null {
  const i = EDITABLE_STEPS.indexOf(step);
  return i > 0 ? EDITABLE_STEPS[i - 1] : null;
}

function TopBar() {
  const { state, dispatch } = useLaunch();
  const current = state.step === "idea" ? "brands" : state.step;
  const activeIndex = STEP_LABELS.findIndex((s) => s.key === current);
  const locked = isLocked(state);

  return (
    <Box
      component="header"
      sx={{ position: "sticky", top: 0, zIndex: (t) => t.zIndex.appBar, borderBottom: 1, borderColor: "divider", backgroundColor: "rgba(8,8,10,0.85)", backdropFilter: "blur(10px)" }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: 1024, mx: "auto", px: 3, py: 1.5, gap: 3 }}>
        <Box component={Link} href="/" sx={{ display: "flex", alignItems: "center", gap: 1, textDecoration: "none", flexShrink: 0 }}>
          <LogoMark size={22} />
          <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>
            LaunchName
          </Typography>
        </Box>

        <Stepper nonLinear activeStep={activeIndex} sx={{ display: { xs: "none", sm: "flex" }, flex: 1, maxWidth: 600 }}>
          {STEP_LABELS.map((s, i) => {
            const reachable = s.key !== current && canNavigateTo(state, s.key);
            const completed = i < activeIndex || (stepIndex(s.key) >= 0 && stepIndex(s.key) <= state.furthestStep && i !== activeIndex);
            return (
              <Step key={s.key} completed={completed}>
                {reachable ? (
                  <Tooltip title={`Back to ${s.label}. Your choices are saved`}>
                    <StepButton onClick={() => dispatch({ type: "SET_STEP", step: s.key })} sx={{ "& .MuiStepLabel-label": { cursor: "pointer" } }}>
                      {s.label}
                    </StepButton>
                  </Tooltip>
                ) : (
                  <Tooltip title={locked && i < activeIndex ? "Your domain is registered, so earlier steps are locked" : ""}>
                    <StepLabel>{s.label}</StepLabel>
                  </Tooltip>
                )}
              </Step>
            );
          })}
        </Stepper>

        <PoweredByBadge className="hidden sm:inline-flex" />
      </Box>
    </Box>
  );
}

function BackBar() {
  const { state, dispatch } = useLaunch();
  const prev = previousStep(state.step);
  if (!prev || isLocked(state)) return null;
  return (
    <Box sx={{ maxWidth: 1024, mx: "auto", px: 3, pt: 3 }}>
      <Button variant="ghost" size="sm" startIcon={<ArrowLeftIcon size={18} aria-hidden />} onClick={() => dispatch({ type: "SET_STEP", step: prev })}>
        Back to {LABEL_OF[prev]}
      </Button>
    </Box>
  );
}

/**
 * Mirrors wizard steps into browser history so the browser's own Back and
 * Forward buttons move between steps instead of leaving the page.
 */
function useStepHistory() {
  const { state, dispatch } = useLaunch();
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    if (!state.hydrated) return;
    const current = window.history.state?.launchStep as WizardStep | undefined;
    if (current === state.step) return;
    const entry = { ...(window.history.state ?? {}), launchStep: state.step };
    // "idea" is a transient loading state, so it gets replaced rather than stacked.
    if (current === undefined || current === "idea") window.history.replaceState(entry, "");
    else window.history.pushState(entry, "");
  }, [state.step, state.hydrated]);

  useEffect(() => {
    function onPop(e: PopStateEvent) {
      const target = e.state?.launchStep as WizardStep | undefined;
      if (!target) return;
      const s = stateRef.current;
      if (target === s.step) return;
      if (canNavigateTo(s, target)) {
        dispatch({ type: "SET_STEP", step: target });
      } else if (isLocked(s)) {
        // Steps behind a purchase are closed; keep walking back out of them
        // so Back lands on the page before the wizard instead of a dead end.
        window.history.back();
      }
    }
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [dispatch]);
}

function WizardBody() {
  const { state, dispatch } = useLaunch();
  const searchParams = useSearchParams();
  const ideaParam = searchParams.get("idea");
  useStepHistory();

  useEffect(() => {
    if (!state.hydrated) return;
    // A new idea from the home page starts fresh; the same idea resumes saved progress.
    if (ideaParam && ideaParam !== state.idea) {
      dispatch({ type: "START", idea: ideaParam, demoMode: searchParams.get("demo") === "1" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.hydrated, ideaParam]);

  if (!state.hydrated || (ideaParam && ideaParam !== state.idea)) {
    return (
      <Box sx={{ display: "flex", minHeight: "50vh", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress size={22} aria-label="Restoring your progress" />
      </Box>
    );
  }

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

  let body: React.ReactNode = null;
  switch (state.step) {
    case "idea":
    case "brands":
      body = <BrandStep />;
      break;
    case "capabilities":
      body = <AgentCapabilityStep onContinue={() => dispatch({ type: "SET_STEP", step: "domains" })} />;
      break;
    case "domains":
      body = <DomainDiscoveryStep />;
      break;
    case "decision":
      body = <DomainDecisionStep onSecure={() => dispatch({ type: "SET_STEP", step: "registering" })} />;
      break;
    case "registering":
      body = <RegistrationStep />;
      break;
    case "launch":
      body = <LaunchCenterStep />;
      break;
  }

  return (
    <>
      <BackBar />
      {body}
    </>
  );
}

export function LaunchWizard() {
  return (
    <LaunchProvider>
      <TopBar />
      <WizardBody />
    </LaunchProvider>
  );
}
