"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Employee } from "@/types";
import toast from "react-hot-toast";

const STATUS_COLORS: Record<string, string> = {
  Active: "bg-green-100 text-green-700",
  Intern: "bg-purple-100 text-purple-700",
  Resigned: "bg-red-100 text-red-700",
  Inactive: "bg-amber-100 text-amber-700",
  Terminated: "bg-red-100 text-red-700",
};

const MODE_COLORS: Record<string, string> = {
  WFH: "bg-blue-100 text-blue-700",
  Onsite: "bg-green-100 text-green-700",
  Hybrid: "bg-orange-100 text-orange-700",
};

const EMPTY_EMP: Partial<Employee> = {
  employeeId: "",
  name: "",
  designation: "",
  department: "",
  joiningDate: "",
  lastWorkingDay: "",
  status: "Active",
  mode: "WFH",
  city: "",
  manager: "",
  mobile: "",
  email: "",
  personalEmail: "",
  dob: "",
  gender: undefined,
  salary: "",
  address: "",
  aadhaar: "",
  pan: "",
  bankName: "",
  accountNo: "",
  ifsc: "",
  branch: "",
  bankAccountName: "",
  emergencyContact: "",
  emergencyPhone: "",
};

export default function EmployeesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterMode, setFilterMode] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 25;

  const [showForm, setShowForm] = useState(false);
  const [editEmp, setEditEmp] = useState<Partial<Employee>>(EMPTY_EMP);
  const [editRow, setEditRow] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const [viewEmp, setViewEmp] = useState<Employee | null>(null);
  const [showSensitive, setShowSensitive] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState<Employee | null>(null);

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sheets?tab=Employees");
      const data = await res.json();
      setEmployees(data);
    } catch {
      toast.error("Failed to load employees");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  // Filter
  const filtered = employees.filter((e) => {
    const q = search.toLowerCase();
    const matchQ =
      !q ||
      e.name.toLowerCase().includes(q) ||
      e.employeeId?.toLowerCase().includes(q) ||
      e.designation?.toLowerCase().includes(q) ||
      e.city?.toLowerCase().includes(q) ||
      e.email?.toLowerCase().includes(q);
    const matchStatus = !filterStatus || e.status === filterStatus;
    const matchMode = !filterMode || e.mode === filterMode;
    return matchQ && matchStatus && matchMode;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function openAdd() {
    setEditEmp({ ...EMPTY_EMP });
    setEditRow(null);
    setShowForm(true);
  }

  function openEdit(emp: Employee) {
    setEditEmp({ ...emp });
    setEditRow(emp.sheetRow || null);
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editRow) {
        // Update existing
        await fetch("/api/sheets", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...editEmp, sheetRow: editRow }),
        });
        toast.success("Employee updated ✓");
      } else {
        // Add new
        await fetch("/api/sheets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editEmp),
        });
        toast.success("Employee added ✓");
      }
      setShowForm(false);
      loadEmployees();
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(emp: Employee) {
    if (!emp.sheetRow) return;
    try {
      await fetch(`/api/sheets?row=${emp.sheetRow}&sheetId=0`, {
        method: "DELETE",
      });
      toast.success("Employee deleted");
      setConfirmDelete(null);
      loadEmployees();
    } catch {
      toast.error("Delete failed");
    }
  }

  const Field = ({
    label, name, type = "text", options, required,
  }: {
    label: string; name: keyof Employee; type?: string; options?: string[]; required?: boolean;
  }) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</label>
      {options ? (
        <select
          value={(editEmp[name] as string) || ""}
          onChange={(ev) => setEditEmp((p) => ({ ...p, [name]: ev.target.value }))}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none"
          required={required}
        >
          <option value="">Select…</option>
          {options.map((o) => <option key={o}>{o}</option>)}
        </select>
      ) : (
        <input
          type={type}
          value={(editEmp[name] as string) || ""}
          onChange={(ev) => setEditEmp((p) => ({ ...p, [name]: ev.target.value }))}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none"
          required={required}
          placeholder={label}
        />
      )}
    </div>
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">👥 Employees</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {employees.length} total · synced from Google Sheets
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadEmployees}
            className="px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm text-slate-600 hover:bg-slate-50"
          >
            🔄 Refresh
          </button>
          {isAdmin && (
            <button
              onClick={openAdd}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              + Add Employee
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="search"
          placeholder="Search name, ID, designation, city…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 min-w-[200px] px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm focus:border-blue-500 outline-none"
        />
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm focus:border-blue-500 outline-none"
        >
          <option value="">All Statuses</option>
          {["Active", "Intern", "Resigned", "Inactive", "Terminated"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select
          value={filterMode}
          onChange={(e) => { setFilterMode(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm focus:border-blue-500 outline-none"
        >
          <option value="">All Modes</option>
          {["WFH", "Onsite", "Hybrid"].map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
        {(search || filterStatus || filterMode) && (
          <button
            onClick={() => { setSearch(""); setFilterStatus(""); setFilterMode(""); setPage(1); }}
            className="px-3 py-2 text-sm text-slate-500 hover:text-red-500"
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-slate-400">Loading employees…</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full data-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Designation</th>
                    <th>Joining</th>
                    <th>Manager</th>
                    <th>Mode</th>
                    <th>City</th>
                    <th>Mobile</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-10 text-slate-400">
                        No employees found
                      </td>
                    </tr>
                  ) : (
                    paginated.map((emp) => (
                      <tr key={emp.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                              {emp.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-slate-800">{emp.name}</p>
                              <p className="text-xs text-slate-500">{emp.employeeId}</p>
                            </div>
                          </div>
                        </td>
                        <td>{emp.designation || "—"}</td>
                        <td className="whitespace-nowrap">{emp.joiningDate || "—"}</td>
                        <td>{emp.manager || "—"}</td>
                        <td>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${MODE_COLORS[emp.mode] || "bg-slate-100 text-slate-600"}`}>
                            {emp.mode}
                          </span>
                        </td>
                        <td>{emp.city || "—"}</td>
                        <td className="text-xs">{emp.mobile || "—"}</td>
                        <td>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[emp.status] || "bg-slate-100 text-slate-600"}`}>
                            {emp.status}
                          </span>
                        </td>
                        <td>
                          <div className="flex gap-1">
                            <button
                              onClick={() => { setViewEmp(emp); setShowSensitive(false); }}
                              className="px-2 py-1 text-xs bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-700 rounded"
                            >
                              View
                            </button>
                            {isAdmin && (
                              <>
                                <button
                                  onClick={() => openEdit(emp)}
                                  className="px-2 py-1 text-xs bg-green-50 text-green-700 hover:bg-green-100 rounded"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => setConfirmDelete(emp)}
                                  className="px-2 py-1 text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-sm text-slate-500">
                <span>
                  {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} employees
                </span>
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded text-xs font-medium ${p === page ? "bg-blue-600 text-white" : "bg-slate-100 hover:bg-slate-200"}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── View Modal ─────────────────────────────────────── */}
      {viewEmp && (
        <Modal title={`${viewEmp.name} — ${viewEmp.employeeId}`} onClose={() => setViewEmp(null)} wide>
          <div className="space-y-6 text-sm">
            <Section title="Employment">
              <Grid>
                <PF label="ID" value={viewEmp.employeeId} />
                <PF label="Designation" value={viewEmp.designation} />
                <PF label="Department" value={viewEmp.department} />
                <PF label="Joining Date" value={viewEmp.joiningDate} />
                <PF label="Last Working Day" value={viewEmp.lastWorkingDay} />
                <PF label="Manager" value={viewEmp.manager} />
                <PF label="Mode" value={viewEmp.mode} />
                <PF label="Status" value={viewEmp.status} />
                <PF label="Salary/Month" value={viewEmp.salary} />
              </Grid>
            </Section>
            <Section title="Personal">
              <Grid>
                <PF label="Date of Birth" value={viewEmp.dob} />
                <PF label="Gender" value={viewEmp.gender} />
                <PF label="City" value={viewEmp.city} />
                <PF label="Address" value={viewEmp.address} full />
              </Grid>
            </Section>
            <Section title="Contact">
              <Grid>
                <PF label="Mobile" value={viewEmp.mobile} />
                <PF label="Official Email" value={viewEmp.email} />
                <PF label="Personal Email" value={viewEmp.personalEmail} />
                <PF label="Emergency Contact" value={viewEmp.emergencyContact} />
                <PF label="Emergency Phone" value={viewEmp.emergencyPhone} />
              </Grid>
            </Section>
            {isAdmin && (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wide">🔒 Sensitive (Admin Only)</h3>
                  <button
                    onClick={() => setShowSensitive(!showSensitive)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    {showSensitive ? "Hide" : "Reveal"}
                  </button>
                </div>
                {showSensitive && (
                  <Grid>
                    <PF label="Aadhaar" value={viewEmp.aadhaar} />
                    <PF label="PAN" value={viewEmp.pan} />
                    <PF label="Account No." value={viewEmp.accountNo} />
                    <PF label="IFSC" value={viewEmp.ifsc} />
                    <PF label="Bank" value={viewEmp.bankName} />
                    <PF label="Branch" value={viewEmp.branch} />
                    <PF label="Name (Bank)" value={viewEmp.bankAccountName} />
                  </Grid>
                )}
              </>
            )}
            {isAdmin && (
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  onClick={() => { setViewEmp(null); openEdit(viewEmp); }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  ✏️ Edit
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* ── Add/Edit Modal ──────────────────────────────────── */}
      {showForm && (
        <Modal
          title={editRow ? "Edit Employee" : "Add Employee"}
          onClose={() => setShowForm(false)}
          wide
        >
          <form onSubmit={handleSave} className="space-y-6">
            <FormSection title="Employment">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Employee ID" name="employeeId" required />
                <Field label="Full Name" name="name" required />
                <Field label="Designation" name="designation" />
                <Field label="Department" name="department" />
                <Field label="Joining Date (DD/MM/YYYY)" name="joiningDate" />
                <Field label="Last Working Day" name="lastWorkingDay" />
                <Field label="Reporting Manager" name="manager" />
                <Field label="Mode" name="mode" options={["WFH", "Onsite", "Hybrid"]} />
                <Field label="Status" name="status" options={["Active", "Intern", "Resigned", "Inactive", "Terminated"]} />
                <Field label="Salary / Month" name="salary" />
              </div>
            </FormSection>
            <FormSection title="Personal">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Date of Birth (DD/MM/YYYY)" name="dob" />
                <Field label="Gender" name="gender" options={["M", "F", "Other"]} />
                <Field label="City" name="city" />
                <Field label="Address" name="address" />
              </div>
            </FormSection>
            <FormSection title="Contact">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Mobile" name="mobile" />
                <Field label="Official Email" name="email" type="email" />
                <Field label="Personal Email" name="personalEmail" type="email" />
                <Field label="Emergency Contact Name" name="emergencyContact" />
                <Field label="Emergency Phone" name="emergencyPhone" />
              </div>
            </FormSection>
            <FormSection title="🔒 Sensitive (Admin Only)">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Aadhaar Number" name="aadhaar" />
                <Field label="PAN Card" name="pan" />
                <Field label="Bank Account Name" name="bankAccountName" />
                <Field label="Account Number" name="accountNo" />
                <Field label="IFSC Code" name="ifsc" />
                <Field label="Bank Name" name="bankName" />
                <Field label="Branch" name="branch" />
              </div>
            </FormSection>
            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-blue-400"
              >
                {saving ? "Saving…" : "💾 Save"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Confirm Delete ──────────────────────────────────── */}
      {confirmDelete && (
        <Modal title="Confirm Delete" onClose={() => setConfirmDelete(null)}>
          <p className="text-sm text-slate-600 mb-6">
            Are you sure you want to delete <strong>{confirmDelete.name}</strong>? This will remove
            the row from Google Sheets and cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setConfirmDelete(null)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => handleDelete(confirmDelete)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Shared sub-components ───────────────────────────────────────────────────
function Modal({
  title, children, onClose, wide,
}: {
  title: string; children: React.ReactNode; onClose: () => void; wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${wide ? "max-w-3xl" : "max-w-md"} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h3 className="font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-3 border-t border-slate-100 pt-3">{title}</h3>
      {children}
    </div>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{children}</div>;
}

function PF({ label, value, full }: { label: string; value?: string; full?: boolean }) {
  return (
    <div className={full ? "col-span-full" : ""}>
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="text-slate-700 mt-0.5">{value || "—"}</p>
    </div>
  );
}
