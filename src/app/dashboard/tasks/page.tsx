"use client";

import { useEffect, useState } from "react";
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Task, TaskStatus, TaskPriority } from "@/types";
import toast from "react-hot-toast";

const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: "⏳ Pending",
  in_progress: "🔄 In Progress",
  completed: "✅ Completed",
};
const STATUS_COLORS: Record<TaskStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
};
const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-red-100 text-red-600",
};

const EMPTY: Omit<Task, "id" | "createdAt" | "updatedAt"> = {
  title: "",
  description: "",
  status: "pending",
  priority: "medium",
  dueDate: "",
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TaskStatus | "">("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Real-time listener
  useEffect(() => {
    const q = query(collection(db, "tasks"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Task)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filtered = filter ? tasks.filter((t) => t.status === filter) : tasks;

  function openAdd() {
    setForm({ ...EMPTY });
    setEditId(null);
    setShowForm(true);
  }

  function openEdit(task: Task) {
    setForm({
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate || "",
    });
    setEditId(task.id);
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Title required"); return; }
    setSaving(true);
    try {
      const now = new Date().toISOString();
      if (editId) {
        await updateDoc(doc(db, "tasks", editId), { ...form, updatedAt: now });
        toast.success("Task updated ✓");
      } else {
        await addDoc(collection(db, "tasks"), { ...form, createdAt: now, updatedAt: now });
        toast.success("Task created ✓");
      }
      setShowForm(false);
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(id: string, status: TaskStatus) {
    await updateDoc(doc(db, "tasks", id), { status, updatedAt: new Date().toISOString() });
    toast.success(`Marked ${status.replace("_", " ")}`);
  }

  async function deleteTask(id: string) {
    await deleteDoc(doc(db, "tasks", id));
    toast.success("Task deleted");
  }

  const counts = {
    pending: tasks.filter((t) => t.status === "pending").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">✅ Tasks</h1>
          <p className="text-slate-500 text-sm mt-0.5">Track your HR action items and follow-ups</p>
        </div>
        <button onClick={openAdd} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          + New Task
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {(["pending", "in_progress", "completed"] as TaskStatus[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(filter === s ? "" : s)}
            className={`bg-white rounded-xl border p-4 text-left hover:shadow-md transition-shadow ${filter === s ? "border-blue-400 ring-2 ring-blue-100" : "border-slate-200"}`}
          >
            <p className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold mb-2 ${STATUS_COLORS[s]}`}>
              {STATUS_LABELS[s]}
            </p>
            <p className="text-2xl font-bold text-slate-800">{counts[s]}</p>
          </button>
        ))}
      </div>

      {/* Task List */}
      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading tasks…</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 text-center py-16 text-slate-400">
          <p className="text-4xl mb-3">✅</p>
          <p className="font-medium">No tasks yet</p>
          <p className="text-sm mt-1">Click "+ New Task" to add one</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((task) => (
            <div key={task.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-4">
              {/* Priority stripe */}
              <div className={`w-1 h-full self-stretch rounded-full ${task.priority === "high" ? "bg-red-400" : task.priority === "medium" ? "bg-amber-400" : "bg-slate-200"}`} />

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <p className={`font-semibold ${task.status === "completed" ? "line-through text-slate-400" : "text-slate-800"}`}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${PRIORITY_COLORS[task.priority]}`}>
                      {task.priority}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[task.status]}`}>
                      {STATUS_LABELS[task.status]}
                    </span>
                  </div>
                </div>
                {task.description && (
                  <p className="text-sm text-slate-500 mt-1">{task.description}</p>
                )}
                <div className="flex items-center gap-4 mt-2">
                  {task.dueDate && (
                    <span className="text-xs text-slate-400">📅 Due: {task.dueDate}</span>
                  )}
                  <span className="text-xs text-slate-400">
                    Created: {new Date(task.createdAt).toLocaleDateString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-1 flex-shrink-0">
                {task.status !== "completed" && (
                  <button
                    onClick={() => updateStatus(task.id, task.status === "pending" ? "in_progress" : "completed")}
                    className="px-2 py-1 text-xs bg-green-50 text-green-700 hover:bg-green-100 rounded"
                  >
                    {task.status === "pending" ? "Start" : "Done"}
                  </button>
                )}
                {task.status === "completed" && (
                  <button
                    onClick={() => updateStatus(task.id, "pending")}
                    className="px-2 py-1 text-xs bg-slate-100 text-slate-600 hover:bg-slate-200 rounded"
                  >
                    Reopen
                  </button>
                )}
                <button onClick={() => openEdit(task)} className="px-2 py-1 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 rounded">
                  Edit
                </button>
                <button onClick={() => deleteTask(task.id)} className="px-2 py-1 text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold">{editId ? "Edit Task" : "New Task"}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Title *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none"
                  placeholder="Task title"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none resize-none"
                  placeholder="Optional details"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value as TaskPriority }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as TaskStatus }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Due Date</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-blue-400">
                  {saving ? "Saving…" : "💾 Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
