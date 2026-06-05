import { NextResponse } from "next/server";
import { getWeeklyQuote } from "@/lib/quotes";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(getWeeklyQuote());
}
