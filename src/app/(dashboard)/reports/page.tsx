"use client";

import { useEffect, useState } from "react";
import { Employee } from "@/types";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from "recharts";
import { format, parseISO, getYear, getMonth } from "date-fns";
import toast from "react-hot-toast";

function parseDate(str?: string): Date | null {
  if (!str) return null;
  if (str.includes("/")) {
    const [dd, mm, yyyy] = str.split("/");
    return new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd));
  }
  try { return parseISO(str); } catch { return null; }
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const PIE_COLORS = ["#2563eb", "#7c3aed", "#16a34a", "#d97706", "#dc2626", "#0891b2"];

export default function ReportsPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  useEffect(() => {
    fetch("/api/sheets?tab=Employees")
      .then((r) => r.json())
      .then(setEmployees)
      .catch(() => toast.error("Failed to load employees"))
      .finally(() => setLoading(false));
  }, []);

  // ── Joiners & Leavers by month (for selected year) ──────────────────────────
  const joinersLeavers = MONTHS.map((month, i) => {
    const joiners = employees.filter((e) => {
      const d = parseDate(e.joiningDate);
      return d && getYear(d) === year && getMonth(d) === i;
    }).length;
    const leavers = employees.filter((e) => {
      const d = parseDate(e.lastWorkingDay);
      return d && getYear(d) === year && getMonth(d) === i;
    }).length;
    return { month, joiners, leavers };
  });

  // ── Attrition rate (yearly) ─────────────────────────────────────────────────
  const startHeadcount = employees.filter((e) => {
    const d = parseDate(e.joiningDate);
    return d && getYear(d) < year;
  }).length;
  const yearLeavers = employees.filter((e) => {
    const d = parseDate(e.lastWorkingDay);
    return d && getYear(d) === year;
  }).length;
  const attritionRate = startHeadcount > 0
    ? ((yearLeavers / startHeadcount) * 100).toFixed(1)
    : "0.0";

  // ── Mode distribution ──────────────────────────────────────────────────────
  const activeEmps = employees.filter((e) => e.status === "Active" || e.status === "Intern");
  const modeCount = ["WFH", "Onsite", "Hybrid"].map((mode) => ({
    name: mode,
    value: activeEmps.filter((e) => e.mode === mode).length,
  }));

  // ── Gender distribution ────────────────────────────────────────────────────
  const genderCount = [
    { name: "Male", value: activeEmps.filter((e) => e.gender === "M").length },
    { name: "Female", value: activeEmps.filter((e) => e.gender === "F").length },
    { name: "Other / Unknown", value: activeEmps.filter((e) => !e.gender || e.gender === "Other").length },
  ];

  // ── Department distribution ────────────────────────────────────────────────
  const deptMap: Record<string, number> = {};
  activeEmps.forEach((e) => {
    const d = e.department || e.designation?.split(" ")[0] || "Other";
    deptMap[d] = (deptMap[d] || 0) + 1;
  });
  const deptData = Object.entries(deptMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  // ── Quarterly joiners ──────────────────────────────────────────────────────
  const quarterlyJoiners = [1, 2, 3, 4].map((q) => {
    const months = [(q - 1) * 3, (q - 1) * 3 + 1, (q - 1) * 3 + 2];
    const joiners = employees.filter((e) => {
      const d = parseDate(e.joiningDate);
      return d && getYear(d) === year && months.includes(getMonth(d));
    }).length;
    const leavers = employees.filter((e) => {
      const d = parseDate(e.lastWorkingDay);
      return d && getYear(d) === year && months.includes(getMonth(d));
    }).length;
    return { quarter: `Q${q}`, joiners, leavers };
  });

  // ── Tenure distribution ─────────────────────────────────────────────────────
  const today = new Date();
  const tenureData = [
    { label: "< 1 year", count: 0 },
    { label: "1–3 years", count: 0 },
    { label: "3–5 years", count: 0 },
    { label: "5–10 years", count: 0 },
    { label: "10+ years", count: 0 },
  ];
  activeEmps.forEach((e) => {
    const d = parseDate(e.joiningDate);
    if (!d) return;
    const years = (today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    if (years < 1) tenureData[0].count++;
    else if (years < 3) tenureData[1].count++;
    else if (years < 5) tenureData[2].count++;
    else if (years < 10) tenureData[3].count++;
    else tenureData[4].count++;
  });

  async function exportPDF() {
    setExportingPdf(true);
    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;
      const doc = new jsPDF();

      doc.setFontSize(18);
      doc.text("Cynapto HR Report", 14, 20);
      doc.setFontSize(11);
      doc.text(`Year: ${year} | Generated: ${format(new Date(), "dd MMM yyyy")}`, 14, 30);

      autoTable(doc, {
        startY: 40,
        head: [["Metric", "Value"]],
        body: [
          ["Total Active Employees", activeEmps.filter((e) => e.status === "Active").length.toString()],
          ["Total Interns", activeEmps.filter((e) => e.status === "Intern").length.toString()],
          [`Joiners in ${year}`, employees.filter((e) => { const d = parseDate(e.joiningDate); return d && getYear(d) === year; }).length.toString()],
          [`Leavers in ${year}`, yearLeavers.toString()],
          [`Attrition Rate ${year}`, `${attritionRate}%`],
          ["WFH Employees", modeCount[0].value.toString()],
          ["Onsite Employees", modeCount[1].value.toString()],
        ],
      });

      doc.save(`cynapto_hr_report_${year}.pdf`);
      toast.success("PDF exported ✓");
    } catch (err) {
      toast.error("PDF export failed");
    } finally {
      setExportingPdf(false);
    }
  }

  async function exportExcel() {
    setExportingExcel(true);
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.utils.book_new();

      // Summary sheet
      const summary = [
        ["Metric", "Value"],
        ["Report Year", year],
        ["Total Active Employees", activeEmps.filter((e) => e.status === "Active").length],
        ["Total Interns", activeEmps.filter((e) => e.status === "Intern").length],
        [`Total Joiners ${year}`, employees.filter((e) => { const d = parseDate(e.joiningDate); return d && getYear(d) === year; }).length],
        [`Total Leavers ${year}`, yearLeavers],
        [`Attrition Rate ${year}`, `${attritionRate}%`],
        ["WFH", modeCount[0].value],
        ["Onsite", modeCount[1].value],
        ["Hybrid", modeCount[2].value],
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), "Summary");

      // Monthly joiners/leavers
      const monthly = [
        ["Month", "Joiners", "Leavers"],
        ...joinersLeavers.map((r) => [r.month, r.joiners, r.leavers]),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(monthly), "Monthly");

      // All employees
      const empData = [
        ["Employee ID", "Name", "Designation", "Status", "Mode", "Joining Date", "LWD", "City"],
        ...employees.map((e) => [e.employeeId, e.name, e.designation, e.status, e.mode, e.joiningDate, e.lastWorkingDay || "", e.city || ""]),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(empData), "Employees");

      XLSX.writeFile(wb, `cynapto_hr_report_${year}.xlsx`);
      toast.success("Excel exported ✓");
    } catch (err) {
      toast.error("Excel export failed");
    } finally {
      setExportingExcel(false);
    }
  }

  if (loading) return <div className="p-6 text-center py-20 text-slate-400">Loading…</div>;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">📊 Reports & Analytics</h1>
          <p className="text-slate-500 text-sm mt-0.5">{employees.length} total employee records</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm focus:border-blue-500 outline-none"
          >
            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
          <button onClick={exportExcel} disabled={exportingExcel} className="px-4 py-2 border border-slate-200 bg-white text-slate-700 rounded-lg text-sm hover:bg-slate-50 disabled:opacity-50">
            {exportingExcel ? "…" : "⬇ Excel"}
          </button>
          <button onClick={exportPDF} disabled={exportingPdf} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {exportingPdf ? "…" : "⬇ PDF"}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Active Employees" value={activeEmps.filter((e) => e.status === "Active").length} color="blue" />
        <KpiCard label={`Joiners ${year}`} value={employees.filter((e) => { const d = parseDate(e.joiningDate); return d && getYear(d) === year; }).length} color="green" />
        <KpiCard label={`Leavers ${year}`} value={yearLeavers} color="red" />
        <KpiCard label={`Attrition ${year}`} value={`${attritionRate}%`} color="orange" isString />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Joiners & Leavers */}
        <ChartCard title={`📈 Monthly Joiners & Leavers — ${year}`}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={joinersLeavers} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="joiners" fill="#2563eb" name="Joiners" radius={[3, 3, 0, 0]} />
              <Bar dataKey="leavers" fill="#dc2626" name="Leavers" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Quarterly */}
        <ChartCard title={`📅 Quarterly Summary — ${year}`}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={quarterlyJoiners} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="quarter" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="joiners" fill="#16a34a" name="Joiners" radius={[3, 3, 0, 0]} />
              <Bar dataKey="leavers" fill="#f97316" name="Leavers" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Work Mode */}
        <ChartCard title="🏠 Work Mode Distribution">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={modeCount} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                {modeCount.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Gender */}
        <ChartCard title="👥 Gender Distribution">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={genderCount} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => value > 0 ? `${name}: ${value}` : ""}>
                {genderCount.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Tenure */}
        <ChartCard title="⏳ Tenure Distribution (Active)">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={tenureData} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#7c3aed" radius={[0, 3, 3, 0]} name="Employees" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Top departments */}
        <ChartCard title="🏢 Top Designations / Departments">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={deptData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} />
              <Tooltip />
              <Bar dataKey="count" fill="#0891b2" radius={[0, 3, 3, 0]} name="Employees" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function KpiCard({
  label, value, color, isString,
}: {
  label: string; value: number | string; color: string; isString?: boolean;
}) {
  const colors: Record<string, string> = {
    blue: "text-blue-600", green: "text-green-600", red: "text-red-500", orange: "text-orange-500",
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-3xl font-bold ${colors[color]}`}>{value}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>
      {children}
    </div>
  );
}
