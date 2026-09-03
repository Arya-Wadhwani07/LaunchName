import { NextResponse } from "next/server";
import { getCapabilityStatus } from "@/lib/apiStatus";
import { providerInfo } from "@/lib/namecom";
import { brandGenerationMode } from "@/lib/brand";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    provider: providerInfo(),
    brandGeneration: brandGenerationMode(),
    capabilities: getCapabilityStatus(),
  });
}
