import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { AgentCapability, AgentCategory } from "./types";

export interface AgentProfileSuggestion {
  description: string;
  category: AgentCategory;
  capabilities: AgentCapability[];
}

const MODEL = "claude-sonnet-4-5";
const CATEGORIES: AgentCategory[] = [
  "travel",
  "finance",
  "education",
  "developer-tools",
  "commerce",
  "productivity",
  "research",
  "customer-support",
  "other",
];

function slugify(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function client() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  return apiKey ? new Anthropic({ apiKey }) : undefined;
}

function extractJson(text: string): unknown {
  const fenced = text.trim().match(/```(?:json)?\s*([\s\S]*?)```/i);
  return JSON.parse(fenced ? fenced[1] : text.trim());
}

function isValid(value: unknown): value is { description: string; category: string; capabilities: string[] } {
  const v = value as any;
  return v && typeof v.description === "string" && typeof v.category === "string" && Array.isArray(v.capabilities);
}

const PROMPT = (idea: string, agentName: string) => `Idea: "${idea}"
Chosen agent/brand name: "${agentName}"

Design what an AI agent for this idea should be able to do. Respond with ONLY JSON (no prose, no markdown fences). Do not use em dashes anywhere in the response:
{
  "description": "One sentence describing what this agent does, written for an agent profile page.",
  "category": "one of: travel, finance, education, developer-tools, commerce, productivity, research, customer-support, other",
  "capabilities": ["3 to 5 short capability labels, e.g. \\"Travel Planning\\", \\"Flight Research\\""]
}`;

async function generateWithClaude(idea: string, agentName: string): Promise<AgentProfileSuggestion> {
  const anthropic = client();
  if (!anthropic) throw new Error("ANTHROPIC_API_KEY not configured");

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 500,
        messages: [{ role: "user", content: PROMPT(idea, agentName) }],
      });
      const textBlock = response.content.find((b) => b.type === "text");
      const parsed = extractJson(textBlock?.type === "text" ? textBlock.text : "");
      if (isValid(parsed)) {
        const category = CATEGORIES.includes(parsed.category as AgentCategory) ? (parsed.category as AgentCategory) : "other";
        return {
          description: parsed.description,
          category,
          capabilities: parsed.capabilities.slice(0, 5).map((label) => ({ id: slugify(label), label })),
        };
      }
    } catch {
      // fall through and retry once
    }
  }
  throw new Error("Claude did not return a parseable agent profile.");
}

const KEYWORD_CAPABILITIES: [RegExp, string[]][] = [
  [/travel|trip|vacation|flight|hotel/i, ["Travel Planning", "Flight Research", "Hotel Research"]],
  [/finance|invoice|budget|expense|accounting/i, ["Financial Analysis", "Expense Tracking", "Reporting"]],
  [/code|debug|developer|software|engineer/i, ["Code Review", "Debugging Help", "Documentation Lookup"]],
  [/support|customer|ticket|help ?desk/i, ["Customer Support", "FAQ", "Ticket Triage"]],
  [/study|student|course|learn|education/i, ["Study Planning", "Q&A Tutoring", "Progress Tracking"]],
  [/apartment|housing|rent|real estate/i, ["Listing Search", "Price Comparison", "Neighborhood Research"]],
  [/shop|commerce|store|product/i, ["Product Search", "Price Comparison", "Order Tracking"]],
];

function generateOffline(idea: string, agentName: string): AgentProfileSuggestion {
  const match = KEYWORD_CAPABILITIES.find(([re]) => re.test(idea));
  const labels = match?.[1] ?? ["Task Planning", "Information Lookup", "Follow-up Reminders"];
  const category: AgentCategory = /travel/i.test(idea)
    ? "travel"
    : /finance/i.test(idea)
      ? "finance"
      : /code|developer/i.test(idea)
        ? "developer-tools"
        : /student|course|study/i.test(idea)
          ? "education"
          : /support|customer/i.test(idea)
            ? "customer-support"
            : /shop|commerce/i.test(idea)
              ? "commerce"
              : "other";

  return {
    description: `An AI agent for: ${idea}`,
    category,
    capabilities: labels.map((label) => ({ id: slugify(label), label })),
  };
}

export type AgentBrainstormMode = "live" | "mock";

export function agentBrainstormMode(): AgentBrainstormMode {
  return process.env.ANTHROPIC_API_KEY ? "live" : "mock";
}

export async function generateAgentProfile(idea: string, agentName: string): Promise<AgentProfileSuggestion> {
  if (agentBrainstormMode() === "mock") return generateOffline(idea, agentName);
  try {
    return await generateWithClaude(idea, agentName);
  } catch {
    return generateOffline(idea, agentName);
  }
}
