"use client";

import { useEffect, useRef } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import Card from "@mui/material/Card";
import { useLaunch } from "@/context/LaunchContext";
import { ProgressStep } from "@/components/ui/data";
import { Button } from "@/components/ui/primitives";

export function RegistrationStep() {
  const { state, dispatch } = useLaunch();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function run() {
    const domain = state.selectedDomain;
    if (!domain || !state.selectedBrand) return;
    dispatch({ type: "REG_RESET" });

    dispatch({ type: "REG_STEP", key: "availabilityConfirmed", state: "active" });
    dispatch({ type: "REG_STEP", key: "registered", state: "active" });
    let launchRecord;
    try {
      const res = await fetch("/api/domains/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domainName: domain.domainName,
          years: state.years,
          privacyEnabled: state.privacyEnabled,
          purchasePrice: domain.purchasePrice,
          idea: state.idea,
          brandName: state.selectedBrand.name,
          tagline: state.selectedBrand.tagline,
          personality: state.selectedBrand.personality,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        dispatch({ type: "REG_STEP", key: "availabilityConfirmed", state: "error" });
        dispatch({ type: "REG_STEP", key: "registered", state: "error" });
        dispatch({ type: "REG_ERROR", error: data.error?.message ?? "Registration failed." });
        return;
      }
      launchRecord = data.launch;
      dispatch({ type: "REG_STEP", key: "availabilityConfirmed", state: "done" });
      dispatch({ type: "REG_STEP", key: "registered", state: "done" });
      dispatch({ type: "SET_LAUNCH", launch: launchRecord });
      dispatch({ type: "ADD_ACTIVITY", message: `Registration confirmed for ${domain.domainName}` });
    } catch {
      dispatch({ type: "REG_STEP", key: "availabilityConfirmed", state: "error" });
      dispatch({ type: "REG_STEP", key: "registered", state: "error" });
      dispatch({ type: "REG_ERROR", error: "We couldn't reach the domain provider. Try again." });
      return;
    }

    dispatch({ type: "REG_STEP", key: "dnsConfigured", state: "active" });
    try {
      const res = await fetch("/api/dns/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domainName: domain.domainName }),
      });
      if (!res.ok) {
        const data = await res.json();
        dispatch({ type: "REG_STEP", key: "dnsConfigured", state: "error" });
        dispatch({ type: "REG_ERROR", error: data.error?.message ?? "DNS configuration needs attention." });
        return;
      }
      dispatch({ type: "REG_STEP", key: "dnsConfigured", state: "done" });
      dispatch({ type: "ADD_ACTIVITY", message: "DNS configured: A, CNAME, and TXT records created" });
    } catch {
      dispatch({ type: "REG_STEP", key: "dnsConfigured", state: "error" });
      dispatch({ type: "REG_ERROR", error: "DNS configuration needs attention." });
      return;
    }

    if (state.agentEnabled) {
      dispatch({ type: "REG_STEP", key: "agentCreated", state: "active" });
      let createdAgent;
      try {
        const res = await fetch("/api/agents/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rootDomain: domain.domainName,
            publicationPoint: "@",
            name: state.agentName || state.selectedBrand.name,
            description: state.agentDescription,
            category: state.agentCategory,
            protocols: state.agentProtocols,
            capabilities: state.agentCapabilities,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          dispatch({ type: "REG_STEP", key: "agentCreated", state: "error" });
          dispatch({ type: "REG_ERROR", error: data.error?.message ?? "Couldn't create the agent identity." });
          return;
        }
        createdAgent = data.agent;
        dispatch({ type: "REG_STEP", key: "agentCreated", state: "done" });
        dispatch({ type: "SET_AGENT", agent: createdAgent });
        dispatch({ type: "ADD_ACTIVITY", message: `Agent identity created: ${createdAgent.name}` });
      } catch {
        dispatch({ type: "REG_STEP", key: "agentCreated", state: "error" });
        dispatch({ type: "REG_ERROR", error: "Couldn't create the agent identity." });
        return;
      }

      dispatch({ type: "REG_STEP", key: "discoveryPublished", state: "active" });
      try {
        const res = await fetch("/api/agents/publish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ host: createdAgent.host }),
        });
        const data = await res.json();
        if (!res.ok) {
          dispatch({ type: "REG_STEP", key: "discoveryPublished", state: "error" });
          dispatch({ type: "REG_ERROR", error: data.error?.message ?? "Couldn't publish discovery metadata." });
          return;
        }
        dispatch({ type: "REG_STEP", key: "discoveryPublished", state: "done" });
        dispatch({ type: "SET_AGENT", agent: data.agent });
        dispatch({ type: "ADD_ACTIVITY", message: "Agent discovery metadata published to DNS" });
      } catch {
        dispatch({ type: "REG_STEP", key: "discoveryPublished", state: "error" });
        dispatch({ type: "REG_ERROR", error: "Couldn't publish discovery metadata." });
        return;
      }

      dispatch({ type: "REG_STEP", key: "agentVerified", state: "active" });
      try {
        const res = await fetch("/api/agents/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ host: createdAgent.host }),
        });
        const data = await res.json();
        if (!res.ok) {
          dispatch({ type: "REG_STEP", key: "agentVerified", state: "error" });
          dispatch({ type: "REG_ERROR", error: data.error?.message ?? "Agent verification needs attention." });
          return;
        }
        dispatch({ type: "REG_STEP", key: "agentVerified", state: "done" });
        dispatch({ type: "SET_AGENT", agent: data.agent });
        dispatch({
          type: "ADD_ACTIVITY",
          message: data.agent.verification.domainOwnershipVerified
            ? "Agent verified: domain ownership confirmed via name.com DNS"
            : "Agent discoverable, domain ownership check pending",
        });
      } catch {
        dispatch({ type: "REG_STEP", key: "agentVerified", state: "error" });
        dispatch({ type: "REG_ERROR", error: "Agent verification needs attention." });
        return;
      }
    }

    dispatch({ type: "REG_STEP", key: "launchReady", state: "active" });
    try {
      const res = await fetch("/api/launch/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domainName: domain.domainName }),
      });
      const data = await res.json();
      if (!res.ok) {
        dispatch({ type: "REG_STEP", key: "launchReady", state: "error" });
        dispatch({ type: "REG_ERROR", error: data.error?.message ?? "Couldn't finish launching." });
        return;
      }
      dispatch({ type: "REG_STEP", key: "launchReady", state: "done" });
      dispatch({ type: "SET_LAUNCH", launch: data.launch });
      dispatch({ type: "ADD_ACTIVITY", message: "Launch completed" });
      setTimeout(() => dispatch({ type: "SET_STEP", step: "launch" }), 500);
    } catch {
      dispatch({ type: "REG_STEP", key: "launchReady", state: "error" });
      dispatch({ type: "REG_ERROR", error: "Couldn't finish launching." });
    }
  }

  function retry() {
    started.current = false;
    run();
  }

  function chooseAnother() {
    dispatch({ type: "SET_STEP", step: "domains" });
  }

  const isConflict = state.registrationError?.includes("just registered");

  return (
    <Box sx={{ mx: "auto", maxWidth: 480, px: 3, py: 10 }}>
      <Typography sx={{ mb: 1, textAlign: "center", fontFamily: "mono", fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "secondary.light" }}>
        Step 5 · Registering
      </Typography>
      <Typography variant="h5" sx={{ mb: 4, textAlign: "center", fontWeight: 600, letterSpacing: "-0.01em" }}>
        Registering {state.selectedDomain?.domainName}
      </Typography>

      <Card sx={{ display: "flex", flexDirection: "column", gap: 2.5, p: 3 }}>
        <ProgressStep label="Domain availability confirmed" state={state.registration.availabilityConfirmed} />
        <ProgressStep label={`Registering ${state.selectedDomain?.domainName}`} state={state.registration.registered} />
        <ProgressStep label="Configuring DNS" state={state.registration.dnsConfigured} />
        {state.agentEnabled && (
          <>
            <ProgressStep label={`Creating agent identity: ${state.agentName || state.selectedBrand?.name}`} state={state.registration.agentCreated} />
            <ProgressStep label="Publishing discovery metadata" state={state.registration.discoveryPublished} />
            <ProgressStep label="Verifying agent" state={state.registration.agentVerified} />
          </>
        )}
        <ProgressStep label={state.agentEnabled ? "Launching website + agent" : "Launching workspace"} state={state.registration.launchReady} />
      </Card>

      {state.registrationError && (
        <Alert severity="error" sx={{ mt: 3, justifyContent: "center", "& .MuiAlert-message": { textAlign: "center", width: "100%" } }}>
          <Typography variant="body2">{state.registrationError}</Typography>
          <Box sx={{ mt: 1.5, display: "flex", justifyContent: "center", gap: 1 }}>
            {isConflict ? (
              <Button size="sm" variant="secondary" onClick={chooseAnother}>
                Choose another domain
              </Button>
            ) : (
              <Button size="sm" variant="secondary" onClick={retry}>
                Try again
              </Button>
            )}
          </Box>
        </Alert>
      )}
    </Box>
  );
}
