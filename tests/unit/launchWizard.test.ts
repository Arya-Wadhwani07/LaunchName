import { describe, expect, it } from "vitest";
import {
  canNavigateTo,
  fromPersisted,
  initialState,
  isLocked,
  reducer,
  toPersisted,
  type LaunchState,
} from "@/context/LaunchContext";

const brandA = { name: "Plumm", tagline: "t", personality: ["warm"], domainSlugs: ["plumm"] } as any;
const brandB = { name: "Forkly", tagline: "t", personality: ["bold"], domainSlugs: ["forkly"] } as any;

function started(): LaunchState {
  return reducer(initialState, { type: "START", idea: "meal planner", demoMode: true });
}

function atDecision(): LaunchState {
  let s = started();
  s = reducer(s, { type: "BRANDS_SUCCESS", brands: [brandA, brandB], forIdea: "meal planner" });
  s = reducer(s, { type: "SELECT_BRAND", brand: brandA });
  s = reducer(s, { type: "SET_STEP", step: "capabilities" });
  s = reducer(s, {
    type: "AGENT_PROFILE_SUCCESS",
    description: "drafted",
    category: "other",
    capabilities: [{ id: "meal-planning", label: "Meal Planning" }],
    forBrand: "Plumm",
  });
  s = reducer(s, { type: "SET_AGENT_DESCRIPTION", description: "my own words" });
  s = reducer(s, { type: "SET_STEP", step: "domains" });
  s = reducer(s, { type: "DOMAINS_SUCCESS", results: [{ domainName: "plumm.dev", purchasable: true } as any], bestPick: null, bestAgentPick: null, forBrand: "Plumm" });
  s = reducer(s, { type: "SELECT_DOMAIN", domain: { domainName: "plumm.dev", purchasable: true } as any });
  return s;
}

describe("wizard navigation", () => {
  it("records the furthest step reached", () => {
    const s = atDecision();
    expect(s.step).toBe("decision");
    expect(s.furthestStep).toBe(3);
  });

  it("allows jumping back, and forward again to any step already reached", () => {
    let s = atDecision();
    s = reducer(s, { type: "SET_STEP", step: "brands" });
    expect(canNavigateTo(s, "capabilities")).toBe(true);
    expect(canNavigateTo(s, "decision")).toBe(true);
    expect(s.furthestStep).toBe(3);
  });

  it("does not allow skipping ahead to a step never reached", () => {
    let s = started();
    s = reducer(s, { type: "BRANDS_SUCCESS", brands: [brandA], forIdea: "meal planner" });
    expect(canNavigateTo(s, "domains")).toBe(false);
  });

  it("keeps all downstream edits when the same brand is picked again", () => {
    let s = atDecision();
    s = reducer(s, { type: "SET_STEP", step: "brands" });
    s = reducer(s, { type: "SELECT_BRAND", brand: brandA });
    expect(s.agentDescription).toBe("my own words");
    expect(s.agentProfileFor).toBe("Plumm");
    expect(s.domainsFor).toBe("Plumm");
    expect(s.selectedDomain?.domainName).toBe("plumm.dev");
  });

  it("clears downstream data and reachable steps when a different brand is picked", () => {
    let s = atDecision();
    s = reducer(s, { type: "SET_STEP", step: "brands" });
    s = reducer(s, { type: "SELECT_BRAND", brand: brandB });
    expect(s.agentDescription).toBe("");
    expect(s.agentCapabilities).toEqual([]);
    expect(s.agentProfileFor).toBeNull();
    expect(s.domainResults).toEqual([]);
    expect(s.selectedDomain).toBeNull();
    expect(canNavigateTo(s, "decision")).toBe(false);
  });

  it("ignores a late API response for a brand the user already moved away from", () => {
    let s = started();
    s = reducer(s, { type: "SELECT_BRAND", brand: brandB });
    s = reducer(s, { type: "AGENT_PROFILE_SUCCESS", description: "stale", category: "other", capabilities: [], forBrand: "Plumm" });
    expect(s.agentDescription).toBe("");
    expect(s.agentProfileFor).toBeNull();
  });

  it("locks earlier steps once registration starts", () => {
    let s = atDecision();
    s = reducer(s, { type: "SET_STEP", step: "registering" });
    expect(isLocked(s)).toBe(true);
    expect(canNavigateTo(s, "brands")).toBe(false);
  });

  it("starting a new idea resets everything", () => {
    let s = atDecision();
    s = reducer(s, { type: "START", idea: "a different idea", demoMode: false });
    expect(s.idea).toBe("a different idea");
    expect(s.selectedBrand).toBeNull();
    expect(s.furthestStep).toBe(0);
    expect(s.hydrated).toBe(true);
  });
});

describe("saved progress", () => {
  it("never persists in-flight loading flags", () => {
    const s = { ...atDecision(), brandsLoading: true, domainsLoading: true, agentProfileLoading: true };
    const saved = toPersisted(s);
    expect(saved).not.toHaveProperty("brandsLoading");
    expect(saved).not.toHaveProperty("domainsLoading");
    expect(saved).not.toHaveProperty("hydrated");
  });

  it("round-trips through JSON and restores the same step and edits", () => {
    const saved = JSON.parse(JSON.stringify(toPersisted(atDecision())));
    const restored = reducer(initialState, { type: "HYDRATE", saved });
    expect(restored.hydrated).toBe(true);
    expect(restored.step).toBe("decision");
    expect(restored.agentDescription).toBe("my own words");
  });

  it("does not resume a half-finished purchase on reload", () => {
    expect(fromPersisted({ step: "registering", launch: null }).step).toBe("decision");
    expect(fromPersisted({ step: "registering", launch: { id: "x" } as any }).step).toBe("launch");
  });

  it("hydrates with nothing saved", () => {
    const s = reducer(initialState, { type: "HYDRATE", saved: null });
    expect(s.hydrated).toBe(true);
    expect(s.step).toBe("idea");
  });
});
