import { NextRequest, NextResponse } from "next/server";
import { fetchEvents, createEvent, deleteEvent } from "@/lib/calendar";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const timeMin = req.nextUrl.searchParams.get("timeMin") || new Date().toISOString();
  const timeMax = req.nextUrl.searchParams.get("timeMax") ||
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  try {
    const events = await fetchEvents(timeMin, timeMax);
    const mapped = events.map((e) => ({
      id: e.id || "",
      title: e.summary || "",
      start: e.start?.dateTime || e.start?.date || "",
      end: e.end?.dateTime || e.end?.date || "",
      description: e.description || "",
      googleEventId: e.id || "",
      type: detectType(e.summary || ""),
    }));
    return NextResponse.json(mapped);
  } catch (err) {
    console.error("Calendar GET error:", err);
    return NextResponse.json({ error: "Calendar not configured" }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const event = await createEvent({
      title: body.title,
      description: body.description,
      start: new Date(body.start).toISOString(),
      end: new Date(body.end).toISOString(),
    });
    return NextResponse.json(event);
  } catch (err) {
    console.error("Calendar POST error:", err);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    await deleteEvent(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}

function detectType(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("interview")) return "interview";
  if (t.includes("open") || t.includes("hiring")) return "position_open";
  if (t.includes("closed") || t.includes("filled") || t.includes("hired")) return "position_closed";
  return "other";
}
