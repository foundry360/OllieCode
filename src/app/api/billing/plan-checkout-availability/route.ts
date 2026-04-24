import { NextResponse } from "next/server";
import { getPlanCheckoutAvailability } from "@/lib/stripe/prices";

/** Runtime Stripe price configuration (booleans only; no secrets). */
export async function GET() {
  return NextResponse.json(getPlanCheckoutAvailability(), { status: 200 });
}
