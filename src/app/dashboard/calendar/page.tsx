"use client";

import { useEffect, useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from "date-fns";
import toast from "react-hot-toast";

interface Event {
  id: string;
  title: string;
  start: string;
  end: string;
  type: "interview" | "position_open" | "position_closed" | "other";
  description?: string;
  googleEventId?: string;
}

const TYPE_COLORS: Record<string, string> = {
  interview: "bg-blue-500",
  position_open: "bg-green-500",
  position_closed: "bg-red-400",
  other: "bg-purple-400",
};
const TYPE_LABELS: Record<string, string> = {
  interview: "🎤 Interview",
  position_open: "🟢 Position Open",
  position_closed: "🔴 Position Closed",
  other: "📌 Other",
};

export default function CalendarPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [form, setForm] = useState({
    title: "",
    start: "",
    end: "",
    type: "interview" as Event["type"],
    description: "",
  });
  const [saving, setSaving] = useState(false);

  async function loadEvents() {
    const timeMin = startOfMonth(currentMonth).toISOString();
    const timeMax = endOfMonth(currentMonth).toISOString();
    try {
      const res = await fetch(`/api/calendar?timeMin=${timeMin}&timeMax=${timeMax}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setEvents(data);
    } catch {
      // Calendar API not yet configured — show empty state
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadEvents(); }, [currentMonth]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Event created ✓");
      setShowForm(false);
      loadEvents();
    } catch {
      toast.error("Failed to create event. Check Google Calendar API config.");
    } finally {
      setSaving(false);
    }
  }

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const getEventsForDay = (day: Date) =>
    events.filter((ev) => isSameDay(new Date(ev.start), day));

  // Stats
  const interviews = events.filter((e) => e.type === "interview").length;
  const openPositions = events.filter((e) => e.type === "position_open").length;
  const closedPositions = events.filter((e) => e.type === "position_closed").length;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">📅 HR Calendar</h1>
          <p className="text-slate-500 text-sm mt-0.5">Interview schedules, open & closed positions</p>
        </div>
        <button
          onClick={() => { setForm({ title: "", start: "", end: "", type: "interview", description: "" }); setShowForm(true); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Add Event
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">🎤 Interviews This Month</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{interviews}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">🟢 Open Positions</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{openPositions}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">🔴 Closed Positions</p>
          <p className="text-2xl font-bold text-red-500 mt-1">{closedPositions}</p>
        </div>
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1))} className="px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-sm hover:bg-slate-50">
          ‹ Prev
        </button>
        <h2 className="text-lg font-semibold text-slate-800">{format(currentMonth, "MMMM yyyy")}</h2>
        <button onClick={() => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1))} className="px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-sm hover:bg-slate-50">
          Next ›
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-100">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-slate-500">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {/* Empty cells for offset */}
          {Array.from({ length: daysInMonth[0].getDay() }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[80px] border-b border-r border-slate-50" />
          ))}
          {daysInMonth.map((day) => {
            const dayEvents = getEventsForDay(day);
            return (
              <div
                key={day.toISOString()}
                className={`min-h-[80px] p-1 border-b border-r border-slate-100 cursor-pointer hover:bg-slate-50 ${isToday(day) ? "bg-blue-50" : ""}`}
                onClick={() => { setSelectedDate(day); }}
              >
                <p className={`text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full ${isToday(day) ? "bg-blue-600 text-white" : "text-slate-700"}`}>
                  {format(day, "d")}
                </p>
                {dayEvents.slice(0, 3).map((ev) => (
                  <div key={ev.id} className={`text-[10px] text-white rounded px-1 py-0.5 mt-0.5 truncate ${TYPE_COLORS[ev.type]}`}>
                    {ev.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <p className="text-[10px] text-slate-400 mt-0.5">+{dayEvents.length - 3} more</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4">
        {Object.entries(TYPE_LABELS).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className={`w-3 h-3 rounded ${TYPE_COLORS[k]}`} />
            {v}
          </div>
        ))}
      </div>

      {/* Selected day panel */}
      {selectedDate && (
        <div className="mt-4 bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-800">{format(selectedDate, "EEEE, dd MMMM yyyy")}</h3>
            <button onClick={() => setSelectedDate(null)} className="text-slate-400 hover:text-slate-600">✕</button>
          </div>
          {getEventsForDay(selectedDate).length === 0 ? (
            <p className="text-sm text-slate-400">No events</p>
          ) : (
            getEventsForDay(selectedDate).map((ev) => (
              <div key={ev.id} className="flex items-start gap-3 py-2 border-b border-slate-100 last:border-0">
                <span className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${TYPE_COLORS[ev.type]}`} />
                <div>
                  <p className="font-medium text-sm text-slate-800">{ev.title}</p>
                  <p className="text-xs text-slate-500">{TYPE_LABELS[ev.type]} · {format(new Date(ev.start), "hh:mm a")} – {format(new Date(ev.end), "hh:mm a")}</p>
                  {ev.description && <p className="text-xs text-slate-500 mt-0.5">{ev.description}</p>}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add event modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold">Add Calendar Event</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {[
                { label: "Title", key: "title", required: true },
                { label: "Description", key: "description" },
              ].map(({ label, key, required }) => (
                <div key={key}>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">{label}</label>
                  <input
                    value={(form as Record<string, string>)[key]}
                    onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                    required={required}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none"
                  />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Start</label>
                  <input type="datetime-local" value={form.start} onChange={(e) => setForm((p) => ({ ...p, start: e.target.value }))} required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">End</label>
                  <input type="datetime-local" value={form.end} onChange={(e) => setForm((p) => ({ ...p, end: e.target.value }))} required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Type</label>
                <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as Event["type"] }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none">
                  {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-blue-400">
                  {saving ? "Saving…" : "📅 Save to Google Calendar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
