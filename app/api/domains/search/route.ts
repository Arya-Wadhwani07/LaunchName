import { NextResponse } from "next/server";
import {
  buildCandidateDomains,
  categoriesForResult,
  pickBestDomain,
  safeCheckAvailability,
  providerInfo,
} from "@/lib/namecom";
import { markCapability } from "@/lib/apiStatus";
import { badRequest } from "@/lib/http";
import { humanBrandScore, agentReadinessScore } from "@/lib/agents/scoring";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const brandName = typeof body.brandName === "string" ? body.brandName.trim() : "";
  const extraSlugs: string[] = Array.isArray(body.extraSlugs) ? body.extraSlugs.filter((s: unknown) => typeof s === "string") : [];
  if (!brandName) return badRequest("Missing brand name.");

  const primary = buildCandidateDomains(brandName, { includeGetPrefix: true });
  const extra = extraSlugs.flatMap((slug) => buildCandidateDomains(slug));
  const domainNames = Array.from(new Set([...primary, ...extra])).slice(0, 24);

  if (domainNames.length === 0) return badRequest("Couldn't build any domain candidates from that name.");

  const { results, errors } = await safeCheckAvailability(domainNames);
  markCapability("availability");
  if (results.length > 0) markCapability("search");

  const withScores = results.map((r) => {
    const human = humanBrandScore(r.sld, r.tld);
    const agent = agentReadinessScore(r.sld, r.tld);
    return {
      ...r,
      categories: categoriesForResult(r),
      humanScore: human.score,
      humanReasons: human.reasons,
      agentScore: agent.score,
      agentReasons: agent.reasons,
    };
  });
  const bestPick = pickBestDomain(results);
  const bestAgentPick = withScores
    .filter((r) => r.purchasable)
    .sort((a, b) => b.agentScore - a.agentScore)[0];

  return NextResponse.json({
    results: withScores,
    bestPick: bestPick?.domainName,
    bestAgentPick: bestAgentPick?.domainName,
    errors,
    provider: providerInfo(),
  });
}
