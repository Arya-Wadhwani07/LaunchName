import { NextResponse } from "next/server";
import { generateBrandSuggestions, brandGenerationMode } from "@/lib/brand";
import { errorResponse, badRequest } from "@/lib/http";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const idea = typeof body.idea === "string" ? body.idea.trim() : "";
  if (!idea) return badRequest("Tell us what you're building first.");
  if (idea.length > 400) return badRequest("That's a lot of idea, try summarizing it in a sentence or two.");

  try {
    const brands = await generateBrandSuggestions(idea);
    return NextResponse.json({ brands, mode: brandGenerationMode() });
  } catch (err) {
    return errorResponse(err);
  }
}
