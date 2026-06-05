/**
 * Anonymous suggestion box API
 * IMPORTANT: No IP address, no user info is stored whatsoever
 */
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// POST /api/suggestions — submit anonymous suggestion
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, category } = body;

    if (!message || typeof message !== "string" || message.trim().length < 5) {
      return NextResponse.json({ error: "Message too short" }, { status: 400 });
    }

    await adminDb.collection("suggestions").add({
      message: message.trim().slice(0, 1000),
      category: category?.trim().slice(0, 50) || "General",
      submittedAt: new Date().toISOString(),
      read: false,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Suggestion submit error:", err);
    return NextResponse.json({ error: "Submission failed" }, { status: 500 });
  }
}

// GET /api/suggestions — fetch all (admin only)
export async function GET() {
  try {
    const snap = await adminDb
      .collection("suggestions")
      .orderBy("submittedAt", "desc")
      .get();

    const suggestions = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    return NextResponse.json(suggestions);
  } catch (err) {
    console.error("Suggestions fetch error:", err);
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}

// PATCH /api/suggestions?id=xxx — mark as read
export async function PATCH(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await adminDb.collection("suggestions").doc(id).update({ read: true });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
