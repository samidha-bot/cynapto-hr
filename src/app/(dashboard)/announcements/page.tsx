"use client";

import { useEffect, useState } from "react";
import { collection, addDoc, deleteDoc, updateDoc, doc, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Announcement } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";
import { format } from "date-fns";

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", pinned: false });
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setAnnouncements(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Announcement)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) { toast.error("Title and body required"); return; }
    setSaving(true);
    try {
      if (editId) {
        await updateDoc(doc(db, "announcements", editId), { ...form });
        toast.success("Updated ✓");
      } else {
        await addDoc(collection(db, "announcements"), {
          ...form,
          createdAt: new Date().toISOString(),
          createdBy: user?.email || "HR Admin",
        });
        toast.success("Posted ✓");
      }
      setShowForm(false);
      setForm({ title: "", body: "", pinned: false });
      setEditId(null);
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await deleteDoc(doc(db, "announcements", id));
    toast.success("Deleted");
  }

  const pinned = announcements.filter((a) => a.pinned);
  const regular = announcements.filter((a) => !a.pinned);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">📢 Announcements</h1>
          <p className="text-slate-500 text-sm mt-0.5">Company updates visible to all users</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => { setForm({ title: "", body: "", pinned: false }); setEditId(null); setShowForm(true); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            + Post Announcement
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400">Loading…</div>
      ) : (
        <div className="space-y-4">
          {pinned.length > 0 && (
            <div>
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-3">📌 Pinned</p>
              {pinned.map((a) => <AnnouncementCard key={a.id} ann={a} isAdmin={isAdmin} onDelete={handleDelete} onEdit={(ann) => { setForm({ title: ann.title, body: ann.body, pinned: !!ann.pinned }); setEditId(ann.id); setShowForm(true); }} />)}
            </div>
          )}
          {regular.length > 0 && (
            <div>
              {pinned.length > 0 && <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 mt-4">All Posts</p>}
              {regular.map((a) => <AnnouncementCard key={a.id} ann={a} isAdmin={isAdmin} onDelete={handleDelete} onEdit={(ann) => { setForm({ title: ann.title, body: ann.body, pinned: !!ann.pinned }); setEditId(ann.id); setShowForm(true); }} />)}
            </div>
          )}
          {announcements.length === 0 && (
            <div className="text-center py-16 text-slate-400">
              <p className="text-4xl mb-3">📢</p>
              <p className="font-medium">No announcements yet</p>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold">{editId ? "Edit Announcement" : "New Announcement"}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Title *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none"
                  placeholder="Announcement title"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Body *</label>
                <textarea
                  value={form.body}
                  onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
                  required rows={5}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none resize-none"
                  placeholder="Write your announcement here…"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.pinned}
                  onChange={(e) => setForm((p) => ({ ...p, pinned: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm text-slate-600">📌 Pin this announcement</span>
              </label>
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-blue-400">
                  {saving ? "Saving…" : "📢 Post"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function AnnouncementCard({
  ann, isAdmin, onDelete, onEdit,
}: {
  ann: Announcement;
  isAdmin: boolean;
  onDelete: (id: string) => void;
  onEdit: (ann: Announcement) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={`bg-white rounded-xl border p-5 mb-3 ${ann.pinned ? "border-amber-300 ring-1 ring-amber-200" : "border-slate-200"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {ann.pinned && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">📌 Pinned</span>}
            <h3 className="font-semibold text-slate-800">{ann.title}</h3>
          </div>
          <p className="text-xs text-slate-400 mb-3">
            By {ann.createdBy} · {ann.createdAt ? format(new Date(ann.createdAt), "dd MMM yyyy") : ""}
          </p>
          <p className={`text-sm text-slate-600 leading-relaxed whitespace-pre-wrap ${!expanded && ann.body.length > 300 ? "line-clamp-3" : ""}`}>
            {ann.body}
          </p>
          {ann.body.length > 300 && (
            <button onClick={() => setExpanded(!expanded)} className="text-xs text-blue-600 hover:underline mt-1">
              {expanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>
        {isAdmin && (
          <div className="flex gap-1 flex-shrink-0">
            <button onClick={() => onEdit(ann)} className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100">Edit</button>
            <button onClick={() => onDelete(ann.id)} className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100">Delete</button>
          </div>
        )}
      </div>
    </div>
  );
}
