import "server-only";

/**
 * Pure application-logic scoring — NOT name.com data. name.com tells us
 * whether a domain is purchasable and what it costs; everything below is
 * LaunchName's own heuristic judgment layered on top, clearly labeled as
 * such everywhere it's displayed (see components/agent/ScorePair.tsx).
 */

export interface ScoreResult {
  score: number;
  reasons: string[];
}

const AI_NATIVE_TLDS = new Set(["ai", "dev", "app", "io"]);
const PREMIUM_HUMAN_TLDS = new Set(["com", "co"]);

function hasRepeatingLetters(s: string) {
  return /(.)\1{2,}/.test(s);
}

function isPronounceable(sld: string) {
  // Very rough heuristic: alternating-ish vowel/consonant runs, no run of
  // more than 3 consonants in a row.
  const vowels = "aeiou";
  let consonantRun = 0;
  for (const ch of sld) {
    if (vowels.includes(ch)) consonantRun = 0;
    else consonantRun++;
    if (consonantRun > 3) return false;
  }
  return true;
}

/** How well this domain works as a human-facing brand — the existing "best pick" signal, made explicit and explainable. */
export function humanBrandScore(sld: string, tld: string): ScoreResult {
  let score = 55;
  const reasons: string[] = [];

  if (sld.length <= 6) {
    score += 20;
    reasons.push("Short");
  } else if (sld.length <= 10) {
    score += 8;
  } else {
    score -= 12;
  }

  if (isPronounceable(sld)) {
    score += 12;
    reasons.push("Memorable");
  } else {
    score -= 10;
  }

  if (!hasRepeatingLetters(sld) && !/\d/.test(sld) && !sld.includes("-")) {
    score += 8;
    reasons.push("Clean spelling");
  } else {
    score -= 8;
  }

  if (PREMIUM_HUMAN_TLDS.has(tld)) {
    score += 15;
    reasons.push("Trusted extension");
  } else if (tld === "ai") {
    score += 6;
  }

  return { score: Math.max(0, Math.min(100, Math.round(score))), reasons };
}

/** How well this domain works as an AI agent's identity/discovery address. */
export function agentReadinessScore(sld: string, tld: string): ScoreResult {
  let score = 50;
  const reasons: string[] = [];

  if (sld.length <= 8) {
    score += 15;
    reasons.push("Short");
  } else {
    score -= 8;
  }

  if (isPronounceable(sld)) {
    score += 10;
    reasons.push("Memorable");
  }

  if (AI_NATIVE_TLDS.has(tld)) {
    score += 20;
    reasons.push("AI-native extension");
  } else if (PREMIUM_HUMAN_TLDS.has(tld)) {
    score += 6;
  }

  if (!/\d/.test(sld) && !sld.includes("-")) {
    score += 8;
    reasons.push("Suitable for an agent identity");
  }

  // Every purchasable, non-premium domain can carry our discovery TXT
  // record and a gateway path — so "ready for agent discovery" is really
  // a floor, not a differentiator, but it's still an honest claim.
  score += 4;
  reasons.push("Ready for agent discovery");

  return { score: Math.max(0, Math.min(100, Math.round(score))), reasons };
}
