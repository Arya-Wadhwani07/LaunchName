import "server-only";
import Anthropic from "@anthropic-ai/sdk";

export interface BrandSuggestion {
  name: string;
  tagline: string;
  personality: string[];
  domainSlugs: string[];
}

const MODEL = "claude-sonnet-4-5";

function client() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return undefined;
  return new Anthropic({ apiKey });
}

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : trimmed;
  return JSON.parse(candidate);
}

function isValidSuggestionList(value: unknown): value is BrandSuggestion[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      (v) =>
        v &&
        typeof v === "object" &&
        typeof (v as any).name === "string" &&
        typeof (v as any).tagline === "string" &&
        Array.isArray((v as any).personality) &&
        Array.isArray((v as any).domainSlugs)
    )
  );
}

const PROMPT = (idea: string) => `You are a senior brand strategist helping a founder name their new product.

Idea: "${idea}"

Generate exactly 5 brandable name candidates for this idea. For each one, think like a naming agency: short, memorable, easy to say out loud, nothing generic or literal.

Respond with ONLY a JSON array (no prose, no markdown fences) of 5 objects shaped exactly like:
{
  "name": "StudyPilot",
  "tagline": "One sentence explaining why this name fits the idea: the story behind it, not a dictionary definition. Do not use em dashes.",
  "personality": ["Focused", "Encouraging", "Modern"],
  "domainSlugs": ["studypilot", "getstudypilot", "studypilotapp"]
}

Rules:
- "name" is a single brandable word or short compound, no spaces, title case.
- "personality" has exactly 3 short adjectives capturing the brand's voice.
- "domainSlugs" has 2-3 lowercase, no-space variants of the name suitable as a domain second-level name (e.g. adding "get" or "app", or a tighter contraction).
- Vary the naming style across the 5 (don't make them all the same pattern).
- No explanation outside the JSON array.`;

/** Real path: Claude generates curated brand suggestions from the idea. */
async function generateWithClaude(idea: string): Promise<BrandSuggestion[]> {
  const anthropic = client();
  if (!anthropic) throw new Error("ANTHROPIC_API_KEY not configured");

  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 1200,
        messages: [{ role: "user", content: PROMPT(idea) }],
      });
      const textBlock = response.content.find((b) => b.type === "text");
      const parsed = extractJson(textBlock?.type === "text" ? textBlock.text : "");
      if (isValidSuggestionList(parsed)) return parsed.slice(0, 5);
      lastError = new Error("Model returned an unexpected shape.");
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Failed to generate brand names.");
}

const WORD_BANK = {
  prefixes: ["Nova", "Flux", "Bright", "True", "Swift", "Clear", "Bold", "Fresh"],
  suffixes: ["ly", "hub", "loop", "base", "kit", "wave", "sprint", "path"],
  personalities: [
    ["Confident", "Clean", "Direct"],
    ["Warm", "Approachable", "Trustworthy"],
    ["Sharp", "Technical", "Efficient"],
    ["Playful", "Energetic", "Fresh"],
    ["Calm", "Reliable", "Grounded"],
  ],
};

function keywords(idea: string): string[] {
  return idea
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !["with", "that", "this", "your", "from", "into", "using", "based"].includes(w))
    .slice(0, 4);
}

/** Mock path: deterministic, keyword-driven names — used only when no ANTHROPIC_API_KEY is set. */
function generateOffline(idea: string): BrandSuggestion[] {
  const kws = keywords(idea);
  const seed = kws[0] ?? "launch";
  const capitalized = seed.charAt(0).toUpperCase() + seed.slice(1);

  const suggestions: BrandSuggestion[] = [];
  for (let i = 0; i < 5; i++) {
    const prefix = WORD_BANK.prefixes[i % WORD_BANK.prefixes.length];
    const suffix = WORD_BANK.suffixes[i % WORD_BANK.suffixes.length];
    const name = i % 2 === 0 ? `${capitalized}${suffix.charAt(0).toUpperCase()}${suffix.slice(1)}` : `${prefix}${capitalized}`;
    const slug = name.toLowerCase();
    suggestions.push({
      name,
      tagline: `A name built around "${seed}": ${kws.slice(1).join(", ") || "clear, ownable, and easy to say out loud"}.`,
      personality: WORD_BANK.personalities[i % WORD_BANK.personalities.length],
      domainSlugs: [slug, `get${slug}`, `${slug}app`],
    });
  }
  return suggestions;
}

export type BrandGenerationMode = "live" | "mock";

export function brandGenerationMode(): BrandGenerationMode {
  return process.env.ANTHROPIC_API_KEY ? "live" : "mock";
}

export async function generateBrandSuggestions(idea: string): Promise<BrandSuggestion[]> {
  if (brandGenerationMode() === "mock") return generateOffline(idea);
  try {
    return await generateWithClaude(idea);
  } catch {
    // Claude is configured but failed (bad key, transient outage, etc.) —
    // degrade to the offline generator rather than blocking the whole flow.
    return generateOffline(idea);
  }
}
