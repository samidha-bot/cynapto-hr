/**
 * Cron endpoint — called daily at 8am IST by Vercel Cron
 * Secured by CRON_SECRET header
 */
import { NextRequest, NextResponse } from "next/server";
import { runDailyReminders } from "@/lib/reminders";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret") || req.nextUrl.searchParams.get("secret");

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results = await runDailyReminders();
    return NextResponse.json({
      success: true,
      processed: results.length,
      details: results,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Reminders cron error:", err);
    return NextResponse.json({ error: "Reminder run failed" }, { status: 500 });
  }
}
