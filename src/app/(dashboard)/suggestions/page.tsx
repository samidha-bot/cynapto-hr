"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Suggestion } from "@/types";
import toast from "react-hot-toast";
import { format } from "date-fns";
import Link from "next/link";

const CATEGORIES = ["General", "Work Culture", "Policy", "Facilities", "Compensation", "Management", "Other"];

export default function SuggestionsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRead, setFilterRead] = useState<"all" | "unread" | "read">("all");

  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailMsg, setEmailMsg] = useState("");
  const [sending, setSending] = useState(false);

  async function loadSuggestions() {
    try {
      const res = await fetch("/api/suggestions");
      const data = await res.json();
      setSuggestions(data);
    } catch {
      toast.error("Failed to load suggestions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadSuggestions(); }, []);

  async function markRead(id: string) {
    await fetch(`/api/suggestions?id=${id}`, { method: "PATCH" });
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, read: true } : s))
    );
  }

  async function sendSuggestionEmail(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      const emails = emailTo.split(",").map((s) => s.trim()).filter(Boolean);
      const res = await fetch("/api/send-suggestion-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails, customMessage: emailMsg }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(`Invitation sent to ${emails.length} email${emails.length > 1 ? "s" : ""} ✓`);
      setShowEmailForm(false);
      setEmailTo(""); setEmailMsg("");
    } catch {
      toast.error("Send failed — check email addresses and Resend config");
    } finally {
      setSending(false);
    }
  }

  const filtered = suggestions.filter((s) => {
    if (filterRead === "unread") return !s.read;
    if (filterRead === "read") return s.read;
    return true;
  });

  const unreadCount = suggestions.filter((s) => !s.read).length;

  if (!isAdmin) {
    return (
      <div className="p-6 text-center py-20 text-slate-400">
        <p className="text-4xl mb-3">🔒</p>
        <p className="font-medium">Admin access required</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">📬 Anonymous Suggestion Box</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {unreadCount} unread · {suggestions.length} total · completely anonymous
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/suggest"
            target="_blank"
            className="px-4 py-2 border border-slate-200 bg-white text-slate-700 rounded-lg text-sm hover:bg-slate-50"
          >
            🔗 Open Form
          </Link>
          <button
            onClick={() => setShowEmailForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            ✉️ Send Invite
          </button>
        </div>
      </div>

      {/* Privacy notice */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <span className="text-green-600 text-xl">🛡️</span>
        <div>
          <p className="text-sm font-semibold text-green-800">Truly Anonymous</p>
          <p className="text-xs text-green-600 mt-0.5">
            No IP address, no user agent, no email, and no identifying information is stored with submissions.
            Each suggestion contains only the text and category chosen by the employee.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {(["all", "unread", "read"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilterRead(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize ${filterRead === f ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
          >
            {f === "unread" && unreadCount > 0 ? `Unread (${unreadCount})` : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-20 text-slate-400">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <p className="text-4xl mb-3">📬</p>
          <p className="font-medium">No suggestions yet</p>
          <p className="text-sm mt-1">Send the anonymous form link to your employees</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => (
            <div
              key={s.id}
              className={`bg-white rounded-xl border p-5 ${!s.read ? "border-blue-200 ring-1 ring-blue-100" : "border-slate-200"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {!s.read && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                    )}
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold">
                      {s.category || "General"}
                    </span>
                    <span className="text-xs text-slate-400">
                      {s.submittedAt ? format(new Date(s.submittedAt), "dd MMM yyyy, hh:mm a") : ""}
                    </span>
                    {!s.read && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-slate-700 leading-relaxed">{s.message}</p>
                </div>
                {!s.read && (
                  <button
                    onClick={() => markRead(s.id)}
                    className="px-2 py-1 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 rounded flex-shrink-0"
                  >
                    Mark read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Send email invite modal */}
      {showEmailForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold">✉️ Send Suggestion Box Invite</h3>
              <button onClick={() => setShowEmailForm(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={sendSuggestionEmail} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">
                  Employee Email(s) *
                </label>
                <input
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  required
                  placeholder="emp1@cynapto.com, emp2@cynapto.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none"
                />
                <p className="text-xs text-slate-400 mt-1">Separate multiple emails with commas</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">
                  Custom Message (optional)
                </label>
                <textarea
                  value={emailMsg}
                  onChange={(e) => setEmailMsg(e.target.value)}
                  rows={3}
                  placeholder="Add a personal message to go with the invitation…"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none resize-none"
                />
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
                The email will contain a link to the anonymous form. The employee does not need to log in.
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowEmailForm(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm">Cancel</button>
                <button type="submit" disabled={sending} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-blue-400">
                  {sending ? "Sending…" : "✉️ Send"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
