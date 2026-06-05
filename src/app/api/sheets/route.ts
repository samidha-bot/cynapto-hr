import { NextRequest, NextResponse } from "next/server";
import {
  fetchEmployeesFromSheet,
  updateEmployeeRow,
  appendEmployeeRow,
  deleteEmployeeRow,
  fetchLeaveData,
} from "@/lib/sheets";
import { Employee } from "@/types";

// GET /api/sheets?tab=Employees
export async function GET(req: NextRequest) {
  const tab = req.nextUrl.searchParams.get("tab") || "Employees";
  try {
    if (tab === "Leave") {
      const data = await fetchLeaveData();
      return NextResponse.json(data);
    }
    const employees = await fetchEmployeesFromSheet(tab);
    return NextResponse.json(employees);
  } catch (err) {
    console.error("Sheets GET error:", err);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}

// POST /api/sheets — add new employee
export async function POST(req: NextRequest) {
  try {
    const body: Partial<Employee> = await req.json();
    await appendEmployeeRow(body);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Sheets POST error:", err);
    return NextResponse.json({ error: "Failed to add employee" }, { status: 500 });
  }
}

// PUT /api/sheets — update employee
export async function PUT(req: NextRequest) {
  try {
    const body: Partial<Employee> & { sheetRow: number } = await req.json();
    if (!body.sheetRow) {
      return NextResponse.json({ error: "sheetRow required" }, { status: 400 });
    }
    await updateEmployeeRow(body);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Sheets PUT error:", err);
    return NextResponse.json({ error: "Failed to update employee" }, { status: 500 });
  }
}

// DELETE /api/sheets?row=5&sheetId=0
export async function DELETE(req: NextRequest) {
  try {
    const row = parseInt(req.nextUrl.searchParams.get("row") || "0");
    const sheetId = parseInt(req.nextUrl.searchParams.get("sheetId") || "0");
    if (!row) return NextResponse.json({ error: "row required" }, { status: 400 });
    await deleteEmployeeRow(row, sheetId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Sheets DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete employee" }, { status: 500 });
  }
}
