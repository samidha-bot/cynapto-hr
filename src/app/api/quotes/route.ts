import { NextResponse } from "next/server";
import { getWeeklyQuote } from "@/lib/quotes";

export async function GET() {
  return NextResponse.json(getWeeklyQuote());
}
