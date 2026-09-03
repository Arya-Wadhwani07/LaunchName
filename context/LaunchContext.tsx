"use client";

import { createContext, useCallback, useContext, useMemo, useReducer } from "react";
import type { BrandSuggestion } from "@/lib/brand";
import type { DomainResultItem } from "@/components/domain/DomainCard";
import type { StepState } from "@/components/ui/data";
import type { ActivityItem } from "@/components/domain/ActivityStream";
import type { LaunchRecord } from "@/lib/store";
import type { AgentCapability, AgentCategory, AgentDiscoveryRecord, AgentProtocol } from "@/lib/agents/types";

export type WizardStep = "idea" | "brands" | "capabilities" | "domains" | "decision" | "registering" | "launch";

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
  step: WizardStep;
  idea: string;
  demoMode: boolean;

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
  step: "idea",
  idea: "",
  demoMode: false,
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

type Action =
  | { type: "SET_STEP"; step: WizardStep }
  | { type: "SET_IDEA"; idea: string; demoMode?: boolean }
  | { type: "BRANDS_LOADING" }
  | { type: "BRANDS_SUCCESS"; brands: BrandSuggestion[] }
  | { type: "BRANDS_ERROR"; error: string }
  | { type: "SELECT_BRAND"; brand: BrandSuggestion }
  | { type: "SET_AGENT_ENABLED"; enabled: boolean }
  | { type: "AGENT_PROFILE_LOADING" }
  | { type: "AGENT_PROFILE_SUCCESS"; description: string; category: AgentCategory; capabilities: AgentCapability[] }
  | { type: "AGENT_PROFILE_ERROR"; error: string }
  | { type: "SET_AGENT_NAME"; name: string }
  | { type: "SET_AGENT_DESCRIPTION"; description: string }
  | { type: "SET_AGENT_PROTOCOLS"; protocols: AgentProtocol[] }
  | { type: "ADD_CAPABILITY"; capability: AgentCapability }
  | { type: "REMOVE_CAPABILITY"; id: string }
  | { type: "DOMAINS_LOADING" }
  | { type: "DOMAINS_SUCCESS"; results: DomainResultItem[]; bestPick: string | null; bestAgentPick: string | null }
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

function reducer(state: LaunchState, action: Action): LaunchState {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, step: action.step };
    case "SET_IDEA":
      return { ...state, idea: action.idea, demoMode: action.demoMode ?? state.demoMode };
    case "BRANDS_LOADING":
      return { ...state, brandsLoading: true, brandsError: null };
    case "BRANDS_SUCCESS":
      return { ...state, brandsLoading: false, brands: action.brands, step: "brands" };
    case "BRANDS_ERROR":
      return { ...state, brandsLoading: false, brandsError: action.error };
    case "SELECT_BRAND":
      return {
        ...state,
        selectedBrand: action.brand,
        agentName: action.brand.name,
        domainResults: [],
        selectedDomain: null,
      };
    case "SET_AGENT_ENABLED":
      return { ...state, agentEnabled: action.enabled };
    case "AGENT_PROFILE_LOADING":
      return { ...state, agentProfileLoading: true, agentProfileError: null };
    case "AGENT_PROFILE_SUCCESS":
      return {
        ...state,
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
      return { ...state, domainsLoading: true, domainsError: null, step: "domains" };
    case "DOMAINS_SUCCESS":
      return { ...state, domainsLoading: false, domainResults: action.results, bestPickDomain: action.bestPick, bestAgentPickDomain: action.bestAgentPick };
    case "DOMAINS_ERROR":
      return { ...state, domainsLoading: false, domainsError: action.error };
    case "SELECT_DOMAIN":
      return { ...state, selectedDomain: action.domain, step: "decision" };
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
      return initialState;
    default:
      return state;
  }
}

const LaunchContext = createContext<{ state: LaunchState; dispatch: React.Dispatch<Action> } | null>(null);

export function LaunchProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
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
