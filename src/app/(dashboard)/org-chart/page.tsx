"use client";

import { useEffect, useState } from "react";
import { Employee } from "@/types";

interface TreeNode {
  name: string;
  designation: string;
  employeeId: string;
  children: TreeNode[];
}

function buildTree(employees: Employee[]): TreeNode[] {
  // Build adjacency: manager name → list of direct reports
  const nodeMap: Record<string, TreeNode> = {};
  const childNames = new Set<string>();

  // Create nodes
  employees.forEach((e) => {
    nodeMap[e.name] = {
      name: e.name,
      designation: e.designation || "",
      employeeId: e.employeeId || "",
      children: [],
    };
  });

  // Link children
  employees.forEach((e) => {
    if (e.manager && nodeMap[e.manager] && e.name !== e.manager) {
      nodeMap[e.manager].children.push(nodeMap[e.name]);
      childNames.add(e.name);
    }
  });

  // Roots = nodes that aren't someone else's child
  return Object.values(nodeMap).filter((n) => !childNames.has(n.name));
}

function TreeNodeCard({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  const [open, setOpen] = useState(depth < 2);
  const colors = [
    "border-blue-400 bg-blue-50",
    "border-purple-400 bg-purple-50",
    "border-green-400 bg-green-50",
    "border-orange-400 bg-orange-50",
    "border-pink-400 bg-pink-50",
  ];
  const color = colors[depth % colors.length];

  return (
    <div className="relative">
      <div
        className={`relative inline-flex flex-col items-center cursor-pointer`}
        onClick={() => node.children.length && setOpen(!open)}
      >
        <div className={`border-2 ${color} rounded-xl px-4 py-3 min-w-[140px] text-center shadow-sm hover:shadow-md transition-shadow`}>
          <div className="w-10 h-10 rounded-full bg-white border-2 border-current flex items-center justify-center text-lg font-bold text-slate-700 mx-auto mb-2">
            {node.name.charAt(0)}
          </div>
          <p className="text-sm font-semibold text-slate-800 leading-tight">{node.name}</p>
          <p className="text-xs text-slate-500 mt-0.5 leading-tight">{node.designation}</p>
          {node.children.length > 0 && (
            <span className="text-xs text-slate-400 mt-1 block">
              {open ? "▲" : `▼ ${node.children.length}`}
            </span>
          )}
        </div>
      </div>

      {open && node.children.length > 0 && (
        <div className="relative mt-4">
          {/* Vertical line down */}
          <div className="absolute top-0 left-1/2 w-px h-4 bg-slate-300 -translate-x-1/2" />
          <div className="flex gap-4 justify-center pt-4 relative">
            {/* Horizontal connector */}
            {node.children.length > 1 && (
              <div className="absolute top-0 left-0 right-0 h-px bg-slate-300" style={{ top: "0px" }} />
            )}
            {node.children.map((child) => (
              <div key={child.name} className="flex flex-col items-center relative">
                <div className="w-px h-4 bg-slate-300 mx-auto" />
                <TreeNodeCard node={child} depth={depth + 1} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrgChartPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/sheets?tab=Employees")
      .then((r) => r.json())
      .then((data: Employee[]) => {
        setEmployees(data.filter((e) => e.status === "Active" || e.status === "Intern"));
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = search
    ? employees.filter((e) =>
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.designation?.toLowerCase().includes(search.toLowerCase())
      )
    : employees;

  const roots = buildTree(filtered);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">🌳 Org Chart</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Auto-generated from Reporting Manager column · {employees.length} employees
          </p>
        </div>
        <input
          type="search"
          placeholder="Search employee…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm focus:border-blue-500 outline-none w-64"
        />
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400">Building org chart…</div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 overflow-auto">
          <div className="flex gap-12 justify-center">
            {roots.map((root) => (
              <TreeNodeCard key={root.name} node={root} />
            ))}
          </div>
          {roots.length === 0 && (
            <p className="text-center text-slate-400 py-16">
              No org chart data. Make sure employees have a Manager column in your Google Sheet.
            </p>
          )}
        </div>
      )}

      <p className="text-xs text-slate-400 mt-4 text-center">
        Click any node to expand / collapse. Roots are employees with no manager listed.
      </p>
    </div>
  );
}
