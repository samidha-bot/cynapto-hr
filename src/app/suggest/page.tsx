"use client";

import { useState } from "react";

const CATEGORIES = ["General", "Work Culture", "Policy", "Facilities", "Compensation", "Management", "Other"];

export default function SuggestionFormPage() {
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("General");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (message.trim().length < 5) { setError("Please write at least a few words."); return; }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim(), category }),
      });
      if (!res.ok) throw new Error("Failed");
      setSubmitted(true);
    } catch {
      setError("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🙏</div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Thank you!</h1>
          <p className="text-slate-500 leading-relaxed">
            Your suggestion has been submitted anonymously. The HR team will read it soon.
          </p>
          <p className="text-xs text-slate-400 mt-4 leading-relaxed">
            Your submission is completely anonymous. No name, email, or IP address was recorded.
          </p>
          <button
            onClick={() => { setSubmitted(false); setMessage(""); setCategory("General"); }}
            className="mt-6 text-sm text-blue-600 hover:underline"
          >
            Submit another suggestion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">📬</div>
          <h1 className="text-2xl font-bold text-slate-800">Anonymous Suggestion Box</h1>
          <p className="text-slate-500 text-sm mt-2 leading-relaxed">
            Share your thoughts freely. This form is 100% anonymous — no login, no name, nothing is tracked.
          </p>
        </div>

        {/* Privacy badge */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-6 flex items-center gap-2">
          <span className="text-green-600">🛡️</span>
          <p className="text-xs text-green-700 font-medium">
            Truly anonymous · No IP logging · No user identification
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
            >
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">
              Your Suggestion *
            </label>
            <textarea
              value={message}
              onChange={(e) => { setMessage(e.target.value); setError(""); }}
              required
              rows={6}
              maxLength={1000}
              placeholder="Share your idea, feedback, or concern. Be as specific as you'd like…"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none resize-none"
            />
            <div className="flex justify-between mt-1">
              {error && <p className="text-xs text-red-500">{error}</p>}
              <p className="text-xs text-slate-400 ml-auto">{message.length}/1000</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || message.trim().length < 5}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-semibold rounded-xl text-sm transition-colors"
          >
            {submitting ? "Submitting…" : "Submit Anonymously 🔒"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-4">
          Powered by Cynapto HR · <a href="/" className="hover:text-blue-500">Return to HR System</a>
        </p>
      </div>
    </div>
  );
}
