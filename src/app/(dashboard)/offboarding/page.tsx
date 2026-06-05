"use client";

import { useEffect, useState } from "react";
import { collection, addDoc, updateDoc, doc, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { OffboardingRecord } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";
import { format, differenceInDays, parseISO } from "date-fns";

const DEFAULT_CHECKLIST = [
  "Exit interview completed",
  "Laptop / equipment returned",
  "Access cards / keys returned",
  "Email account deactivated",
  "Removed from Slack / Teams",
  "Full & final settlement initiated",
  "Relieving letter issued",
  "Experience letter issued",
  "PF / gratuity processed",
  "NOC issued (if applicable)",
];

function makeChecklist(items: string[]) {
  return items.map((label) => ({
    id: crypto.randomUUID?.() || Math.random().toString(36).slice(2),
    label,
    done: false,
  }));
}

function parseDate(str?: string) {
  if (!str) return null;
  if (str.includes("/")) {
    const [dd, mm, yyyy] = str.split("/");
    return new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd));
  }
  try { return parseISO(str); } catch { return null; }
}

export default function OffboardingPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [records, setRecords] = useState<OffboardingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ employeeId: "", employeeName: "", exitDate: "" });
  const [saving, setSaving] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "offboarding"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setRecords(snap.docs.map((d) => ({ id: d.id, ...d.data() } as OffboardingRecord)));
      setLoading(false);
    });
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await addDoc(collection(db, "offboarding"), {
        ...form,
        checklist: makeChecklist(DEFAULT_CHECKLIST),
        alertSent: false,
        createdAt: new Date().toISOString(),
      });
      toast.success("Offboarding record created ✓");
      setShowAdd(false);
      setForm({ employeeId: "", employeeName: "", exitDate: "" });
    } catch {
      toast.error("Failed");
    } finally {
      setSaving(false);
    }
  }

  async function toggleItem(recordId: string, itemId: string, done: boolean) {
    const record = records.find((r) => r.id === recordId);
    if (!record) return;
    const updated = record.checklist.map((item) =>
      item.id === itemId ? { ...item, done, doneAt: done ? new Date().toISOString() : undefined } : item
    );
    await updateDoc(doc(db, "offboarding", recordId), { checklist: updated });
  }

  const today = new Date();

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">🚪 Offboarding</h1>
          <p className="text-slate-500 text-sm mt-0.5">Track exit checklists · Alerts sent 2 days before exit</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowAdd(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            + Add Exit Record
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400">Loading…</div>
      ) : records.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-4xl mb-3">🚪</p>
          <p className="font-medium">No offboarding records yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((rec) => {
            const exitDate = parseDate(rec.exitDate);
            const daysLeft = exitDate ? differenceInDays(exitDate, today) : null;
            const pct = Math.round((rec.checklist.filter((i) => i.done).length / rec.checklist.length) * 100);
            const isOpen = openId === rec.id;
            const isUrgent = daysLeft !== null && daysLeft >= 0 && daysLeft <= 3;

            return (
              <div key={rec.id} className={`bg-white rounded-xl border overflow-hidden ${isUrgent ? "border-red-300 ring-1 ring-red-100" : "border-slate-200"}`}>
                <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-slate-50" onClick={() => setOpenId(isOpen ? null : rec.id)}>
                  <div className="w-10 h-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold flex-shrink-0">
                    {rec.employeeName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800">{rec.employeeName}</p>
                    <p className="text-xs text-slate-500">
                      {rec.employeeId} · Exit: {rec.exitDate}
                      {daysLeft !== null && daysLeft >= 0 && (
                        <span className={isUrgent ? " font-bold text-red-600" : ""}>
                          {" "}({daysLeft === 0 ? "Today!" : `${daysLeft} day${daysLeft !== 1 ? "s" : ""} left`})
                        </span>
                      )}
                      {daysLeft !== null && daysLeft < 0 && " (Exited)"}
                    </p>
                  </div>
                  <div className="w-24 flex-shrink-0">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>{pct}%</span>
                      <span>{rec.checklist.filter((i) => i.done).length}/{rec.checklist.length}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${pct === 100 ? "bg-green-500" : isUrgent ? "bg-red-500" : "bg-blue-500"}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <span className="text-slate-400 text-sm">{isOpen ? "▲" : "▼"}</span>
                </div>

                {isOpen && (
                  <div className="border-t border-slate-100 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {rec.checklist.map((item) => (
                        <label key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.done}
                            onChange={(e) => isAdmin && toggleItem(rec.id, item.id, e.target.checked)}
                            disabled={!isAdmin}
                            className="rounded text-blue-600"
                          />
                          <div>
                            <p className={`text-sm ${item.done ? "line-through text-slate-400" : "text-slate-700"}`}>
                              {item.label}
                            </p>
                            {item.done && item.doneAt && (
                              <p className="text-xs text-slate-400">
                                {format(new Date(item.doneAt), "dd MMM yyyy")}
                              </p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold">New Exit Record</h3>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              {[
                { label: "Employee ID", key: "employeeId" },
                { label: "Employee Name", key: "employeeName" },
                { label: "Exit Date (DD/MM/YYYY)", key: "exitDate" },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">{label}</label>
                  <input
                    value={(form as Record<string, string>)[key]}
                    onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none"
                    placeholder={label}
                    required
                  />
                </div>
              ))}
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-blue-400">
                  {saving ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
