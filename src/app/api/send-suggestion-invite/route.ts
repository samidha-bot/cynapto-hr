import { NextRequest, NextResponse } from "next/server";
import { sendSuggestionBoxEmail } from "@/lib/email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { emails, customMessage } = await req.json();
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: "No emails provided" }, { status: 400 });
    }
    await sendSuggestionBoxEmail(emails, customMessage);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Send suggestion invite error:", err);
    return NextResponse.json({ error: "Send failed" }, { status: 500 });
  }
}
