"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface LeaveRow {
  employeeId: string;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: string;
  status: string;
  notes: string;
}

export default function LeavePage() {
  const [rows, setRows] = useState<LeaveRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/sheets?tab=Leave");
      const raw: string[][] = await res.json();
      if (!raw || raw.length < 2) { setRows([]); return; }
      const headers = raw[0];
      const get = (row: string[], key: string) => {
        const i = headers.findIndex((h) => h.toLowerCase().replace(/\s/g, "") === key.toLowerCase().replace(/\s/g, ""));
        return i >= 0 ? row[i] || "" : "";
      };
      setRows(
        raw.slice(1).map((r) => ({
          employeeId: get(r, "employeeid"),
          employeeName: get(r, "employeename") || get(r, "name"),
          leaveType: get(r, "leavetype"),
          startDate: get(r, "startdate"),
          endDate: get(r, "enddate"),
          days: get(r, "days"),
          status: get(r, "status") || "Approved",
          notes: get(r, "notes"),
        }))
      );
    } catch {
      toast.error("Failed to load leave data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = rows.filter((r) => {
    const q = search.toLowerCase();
    return (
      (!q || r.employeeName.toLowerCase().includes(q) || r.employeeId.toLowerCase().includes(q)) &&
      (!filterStatus || r.status === filterStatus)
    );
  });

  const STATUS_COLORS: Record<string, string> = {
    Approved: "bg-green-100 text-green-700",
    Pending: "bg-amber-100 text-amber-700",
    Rejected: "bg-red-100 text-red-700",
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">🏖️ Leave</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Read from the "Leave" tab in your Google Sheet · {rows.length} records
          </p>
        </div>
        <button onClick={load} className="px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm text-slate-600 hover:bg-slate-50">
          🔄 Refresh
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <p className="text-sm text-amber-800">
          <strong>ℹ️ How it works:</strong> HR manually updates leave data in the <strong>"Leave"</strong> tab of your Google Sheet.
          This dashboard automatically reads and displays it. No data entry needed here — just update your Sheet.
        </p>
      </div>

      <div className="flex gap-3 mb-4">
        <input
          type="search"
          placeholder="Search employee…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-0 px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm focus:border-blue-500 outline-none"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm focus:border-blue-500 outline-none"
        >
          <option value="">All Statuses</option>
          {["Approved", "Pending", "Rejected"].map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-slate-400">Loading leave data…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Leave Type</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Days</th>
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400">
                      {rows.length === 0
                        ? "No data in Leave sheet. Update your Google Sheet and refresh."
                        : "No results"}
                    </td>
                  </tr>
                ) : (
                  filtered.map((r, i) => (
                    <tr key={i}>
                      <td>
                        <p className="font-medium text-slate-800">{r.employeeName || "—"}</p>
                        <p className="text-xs text-slate-400">{r.employeeId}</p>
                      </td>
                      <td>{r.leaveType || "—"}</td>
                      <td className="whitespace-nowrap">{r.startDate || "—"}</td>
                      <td className="whitespace-nowrap">{r.endDate || "—"}</td>
                      <td>{r.days || "—"}</td>
                      <td>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[r.status] || "bg-slate-100 text-slate-600"}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="text-xs text-slate-500">{r.notes || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
