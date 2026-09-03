import { NextResponse } from "next/server";
import { getAccountBalance, providerInfo } from "@/lib/namecom";
import { markCapability } from "@/lib/apiStatus";
import { errorResponse } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const balance = await getAccountBalance();
    markCapability("accountInfo");
    return NextResponse.json({ balance: balance.balance, provider: providerInfo() });
  } catch (err) {
    return errorResponse(err);
  }
}
