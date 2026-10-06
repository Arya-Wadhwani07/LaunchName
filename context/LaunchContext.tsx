"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from "react";
import type { BrandSuggestion } from "@/lib/brand";
import type { DomainResultItem } from "@/components/domain/DomainCard";
import type { StepState } from "@/components/ui/data";
import type { ActivityItem } from "@/components/domain/ActivityStream";
import type { LaunchRecord } from "@/lib/store";
import type { AgentCapability, AgentCategory, AgentDiscoveryRecord, AgentProtocol } from "@/lib/agents/types";

export type WizardStep = "idea" | "brands" | "capabilities" | "domains" | "decision" | "registering" | "launch";

/** Steps the user can freely move between. Once registration starts the domain is purchased, so earlier steps lock. */
export const EDITABLE_STEPS: WizardStep[] = ["brands", "capabilities", "domains", "decision"];

const STORAGE_KEY = "launchname:wizard:v1";

export interface RegistrationProgress {
  availabilityConfirmed: StepState;
  registered: StepState;
  dnsConfigured: StepState;
  agentCreated: StepState;
  discoveryPublished: StepState;
  agentVerified: StepState;
  launchReady: StepState;
}

const EMPTY_REGISTRATION: RegistrationProgress = {
  availabilityConfirmed: "pending",
  registered: "pending",
  dnsConfigured: "pending",
  agentCreated: "pending",
  discoveryPublished: "pending",
  agentVerified: "pending",
  launchReady: "pending",
};

interface LaunchState {
  /** False until sessionStorage has been read on the client, so nothing fetches against not-yet-restored state. */
  hydrated: boolean;
  step: WizardStep;
  /** Furthest editable step reached, so saved later steps stay reachable after going back. */
  furthestStep: number;
  idea: string;
  demoMode: boolean;

  /** What each piece of fetched data was generated for. A step only refetches when this no longer matches. */
  brandsFor: string | null;
  agentProfileFor: string | null;
  domainsFor: string | null;

  brands: BrandSuggestion[];
  brandsLoading: boolean;
  brandsError: string | null;
  selectedBrand: BrandSuggestion | null;

  agentEnabled: boolean;
  agentName: string;
  agentDescription: string;
  agentCategory: AgentCategory;
  agentProtocols: AgentProtocol[];
  agentCapabilities: AgentCapability[];
  agentProfileLoading: boolean;
  agentProfileError: string | null;

  domainResults: DomainResultItem[];
  domainsLoading: boolean;
  domainsError: string | null;
  bestPickDomain: string | null;
  bestAgentPickDomain: string | null;
  selectedDomain: DomainResultItem | null;

  /** Valid values depend on the selected domain's TLD (e.g. .ai requires 2+) — see DomainDecisionStep, which fetches the real constraint from name.com. */
  years: number;
  privacyEnabled: boolean;

  registration: RegistrationProgress;
  registrationError: string | null;
  launch: LaunchRecord | null;
  agent: AgentDiscoveryRecord | null;

  activity: ActivityItem[];
}

const initialState: LaunchState = {
  hydrated: false,
  step: "idea",
  furthestStep: 0,
  idea: "",
  demoMode: false,
  brandsFor: null,
  agentProfileFor: null,
  domainsFor: null,
  brands: [],
  brandsLoading: false,
  brandsError: null,
  selectedBrand: null,
  agentEnabled: true,
  agentName: "",
  agentDescription: "",
  agentCategory: "other",
  agentProtocols: ["https"],
  agentCapabilities: [],
  agentProfileLoading: false,
  agentProfileError: null,
  domainResults: [],
  domainsLoading: false,
  domainsError: null,
  bestPickDomain: null,
  bestAgentPickDomain: null,
  selectedDomain: null,
  years: 1,
  privacyEnabled: true,
  registration: EMPTY_REGISTRATION,
  registrationError: null,
  launch: null,
  agent: null,
  activity: [],
};

export type Action =
  | { type: "HYDRATE"; saved: Partial<LaunchState> | null }
  | { type: "START"; idea: string; demoMode: boolean }
  | { type: "SET_STEP"; step: WizardStep }
  | { type: "SET_IDEA"; idea: string; demoMode?: boolean }
  | { type: "BRANDS_LOADING" }
  | { type: "BRANDS_SUCCESS"; brands: BrandSuggestion[]; forIdea?: string }
  | { type: "BRANDS_ERROR"; error: string }
  | { type: "SELECT_BRAND"; brand: BrandSuggestion }
  | { type: "SET_AGENT_ENABLED"; enabled: boolean }
  | { type: "AGENT_PROFILE_LOADING" }
  | { type: "AGENT_PROFILE_SUCCESS"; description: string; category: AgentCategory; capabilities: AgentCapability[]; forBrand?: string }
  | { type: "AGENT_PROFILE_ERROR"; error: string }
  | { type: "SET_AGENT_NAME"; name: string }
  | { type: "SET_AGENT_DESCRIPTION"; description: string }
  | { type: "SET_AGENT_PROTOCOLS"; protocols: AgentProtocol[] }
  | { type: "ADD_CAPABILITY"; capability: AgentCapability }
  | { type: "REMOVE_CAPABILITY"; id: string }
  | { type: "DOMAINS_LOADING" }
  | { type: "DOMAINS_SUCCESS"; results: DomainResultItem[]; bestPick: string | null; bestAgentPick: string | null; forBrand?: string }
  | { type: "DOMAINS_ERROR"; error: string }
  | { type: "SELECT_DOMAIN"; domain: DomainResultItem }
  | { type: "SET_YEARS"; years: number }
  | { type: "SET_PRIVACY"; enabled: boolean }
  | { type: "REG_STEP"; key: keyof RegistrationProgress; state: StepState }
  | { type: "REG_ERROR"; error: string }
  | { type: "REG_RESET" }
  | { type: "SET_LAUNCH"; launch: LaunchRecord }
  | { type: "SET_AGENT"; agent: AgentDiscoveryRecord }
  | { type: "ADD_ACTIVITY"; message: string }
  | { type: "RESET" };

export function stepIndex(step: WizardStep): number {
  return step === "idea" ? 0 : EDITABLE_STEPS.indexOf(step);
}

/** True once a domain has been bought — after that the earlier steps can't change anything. */
export function isLocked(state: Pick<LaunchState, "step" | "launch">): boolean {
  return state.launch !== null || state.step === "registering" || state.step === "launch";
}

export function canNavigateTo(state: Pick<LaunchState, "step" | "launch" | "furthestStep">, target: WizardStep): boolean {
  if (isLocked(state)) return false;
  const i = stepIndex(target);
  return i >= 0 && i <= state.furthestStep;
}

function withStep(state: LaunchState, step: WizardStep): LaunchState {
  const i = stepIndex(step);
  return { ...state, step, furthestStep: i >= 0 ? Math.max(state.furthestStep, i) : state.furthestStep };
}

/** What gets written to sessionStorage — in-flight flags are dropped so a reload never shows a spinner for a request that no longer exists. */
export function toPersisted(state: LaunchState): Partial<LaunchState> {
  const { hydrated: _hydrated, brandsLoading: _b, agentProfileLoading: _a, domainsLoading: _d, ...rest } = state;
  return rest;
}

/** Restored state, with a mid-registration reload sent somewhere safe instead of re-running a purchase. */
export function fromPersisted(saved: Partial<LaunchState>): Partial<LaunchState> {
  const next = { ...saved, brandsLoading: false, agentProfileLoading: false, domainsLoading: false };
  if (next.step === "registering") next.step = next.launch ? "launch" : "decision";
  return next;
}

export function reducer(state: LaunchState, action: Action): LaunchState {
  switch (action.type) {
    case "HYDRATE":
      return action.saved ? { ...state, ...fromPersisted(action.saved), hydrated: true } : { ...state, hydrated: true };
    case "START":
      return { ...initialState, hydrated: true, idea: action.idea, demoMode: action.demoMode };
    case "SET_STEP":
      return withStep(state, action.step);
    case "SET_IDEA":
      return { ...state, idea: action.idea, demoMode: action.demoMode ?? state.demoMode };
    case "BRANDS_LOADING":
      return { ...state, brandsLoading: true, brandsError: null };
    case "BRANDS_SUCCESS":
      if (action.forIdea !== undefined && action.forIdea !== state.idea) return state;
      return { ...withStep(state, state.step === "idea" ? "brands" : state.step), brandsLoading: false, brands: action.brands, brandsFor: state.idea };
    case "BRANDS_ERROR":
      return { ...state, brandsLoading: false, brandsError: action.error };
    case "SELECT_BRAND":
      // Re-picking the same brand after going back keeps everything the
      // user already did downstream. A different brand invalidates it.
      if (state.selectedBrand?.name === action.brand.name) return state;
      return {
        ...state,
        selectedBrand: action.brand,
        agentName: action.brand.name,
        agentDescription: "",
        agentCapabilities: [],
        agentProfileFor: null,
        agentProfileError: null,
        domainResults: [],
        domainsFor: null,
        bestPickDomain: null,
        bestAgentPickDomain: null,
        selectedDomain: null,
        furthestStep: Math.min(state.furthestStep, stepIndex("brands")),
      };
    case "SET_AGENT_ENABLED":
      return { ...state, agentEnabled: action.enabled };
    case "AGENT_PROFILE_LOADING":
      return { ...state, agentProfileLoading: true, agentProfileError: null };
    case "AGENT_PROFILE_SUCCESS":
      if (action.forBrand !== undefined && action.forBrand !== state.selectedBrand?.name) return state;
      return {
        ...state,
        agentProfileFor: state.selectedBrand?.name ?? null,
        agentProfileLoading: false,
        agentDescription: action.description,
        agentCategory: action.category,
        agentCapabilities: action.capabilities,
      };
    case "AGENT_PROFILE_ERROR":
      return { ...state, agentProfileLoading: false, agentProfileError: action.error };
    case "SET_AGENT_NAME":
      return { ...state, agentName: action.name };
    case "SET_AGENT_DESCRIPTION":
      return { ...state, agentDescription: action.description };
    case "SET_AGENT_PROTOCOLS":
      return { ...state, agentProtocols: action.protocols };
    case "ADD_CAPABILITY":
      return state.agentCapabilities.some((c) => c.id === action.capability.id)
        ? state
        : { ...state, agentCapabilities: [...state.agentCapabilities, action.capability] };
    case "REMOVE_CAPABILITY":
      return { ...state, agentCapabilities: state.agentCapabilities.filter((c) => c.id !== action.id) };
    case "DOMAINS_LOADING":
      return { ...state, domainsLoading: true, domainsError: null };
    case "DOMAINS_SUCCESS":
      if (action.forBrand !== undefined && action.forBrand !== state.selectedBrand?.name) return state;
      return {
        ...state,
        domainsLoading: false,
        domainsFor: state.selectedBrand?.name ?? null,
        domainResults: action.results,
        bestPickDomain: action.bestPick,
        bestAgentPickDomain: action.bestAgentPick,
      };
    case "DOMAINS_ERROR":
      return { ...state, domainsLoading: false, domainsError: action.error };
    case "SELECT_DOMAIN":
      return withStep({ ...state, selectedDomain: action.domain }, "decision");
    case "SET_YEARS":
      return { ...state, years: action.years };
    case "SET_PRIVACY":
      return { ...state, privacyEnabled: action.enabled };
    case "REG_STEP":
      return { ...state, registration: { ...state.registration, [action.key]: action.state } };
    case "REG_ERROR":
      return { ...state, registrationError: action.error };
    case "REG_RESET":
      return { ...state, registrationError: null, registration: EMPTY_REGISTRATION };
    case "SET_LAUNCH":
      return { ...state, launch: action.launch };
    case "SET_AGENT":
      return { ...state, agent: action.agent };
    case "ADD_ACTIVITY":
      return {
        ...state,
        activity: [...state.activity, { id: Math.random().toString(36).slice(2), timestamp: new Date().toISOString(), message: action.message }],
      };
    case "RESET":
      return { ...initialState, hydrated: true };
    default:
      return state;
  }
}

export { initialState };
export type { LaunchState };

const LaunchContext = createContext<{ state: LaunchState; dispatch: React.Dispatch<Action> } | null>(null);

export function LaunchProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Restore after mount (never during render) so server and client markup match.
  useEffect(() => {
    let saved: Partial<LaunchState> | null = null;
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      saved = raw ? (JSON.parse(raw) as Partial<LaunchState>) : null;
    } catch {
      saved = null;
    }
    dispatch({ type: "HYDRATE", saved });
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(toPersisted(state)));
    } catch {
      // Storage full or blocked (private mode) — progress just won't survive a reload.
    }
  }, [state]);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <LaunchContext.Provider value={value}>{children}</LaunchContext.Provider>;
}

export function useLaunch() {
  const ctx = useContext(LaunchContext);
  if (!ctx) throw new Error("useLaunch must be used within LaunchProvider");
  return ctx;
}

export function useLaunchActions() {
  const { dispatch } = useLaunch();

  const log = useCallback((message: string) => dispatch({ type: "ADD_ACTIVITY", message }), [dispatch]);

  return { dispatch, log };
}
