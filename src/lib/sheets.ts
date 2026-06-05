/**
 * Google Sheets integration — two-way sync with employee database
 * Uses a Service Account so no user OAuth is needed
 */
import { google } from "googleapis";
import { Employee } from "@/types";

const SHEET_ID = process.env.GOOGLE_SHEETS_ID!;

// Column mapping — adjust column letters to match your sheet
const COLUMNS = {
  employeeId: "A",
  name: "B",
  designation: "C",
  department: "D",
  joiningDate: "E",
  lastWorkingDay: "F",
  status: "G",
  mode: "H",
  city: "I",
  manager: "J",
  mobile: "K",
  email: "L",
  personalEmail: "M",
  dob: "N",
  gender: "O",
  salary: "P",
  address: "Q",
  aadhaar: "R",
  pan: "S",
  bankAccountName: "T",
  accountNo: "U",
  ifsc: "V",
  bankName: "W",
  branch: "X",
  emergencyContact: "Y",
  emergencyPhone: "Z",
};

// Header row values (must match your sheet's row 1)
export const SHEET_HEADERS = Object.keys(COLUMNS);

function getAuth() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(
        /\\n/g,
        "\n"
      ),
    },
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
    ],
  });
  return auth;
}

export async function getSheetsClient() {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  return sheets;
}

/**
 * Fetch all employees from the "Employees" tab of the Google Sheet.
 * Row 1 is the header; data starts at row 2.
 */
export async function fetchEmployeesFromSheet(
  sheetTab = "Employees"
): Promise<Employee[]> {
  const sheets = await getSheetsClient();
  const range = `${sheetTab}!A1:Z`;

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range,
  });

  const rows = response.data.values;
  if (!rows || rows.length < 2) return [];

  const headers = rows[0] as string[];

  return rows.slice(1).map((row, index) => {
    const get = (key: string) => {
      const colIndex = headers.findIndex(
        (h) => h.toLowerCase().replace(/\s/g, "") === key.toLowerCase()
      );
      return colIndex >= 0 ? (row[colIndex] || "") : "";
    };

    return {
      id: `row_${index + 2}`,
      sheetRow: index + 2,
      employeeId: get("employeeid") || get("id"),
      name: get("name"),
      designation: get("designation"),
      department: get("department"),
      joiningDate: get("joiningdate") || get("joining"),
      lastWorkingDay: get("lastworkingday") || get("lwd"),
      status: (get("status") as Employee["status"]) || "Active",
      mode: (get("mode") as Employee["mode"]) || "WFH",
      city: get("city"),
      manager: get("manager") || get("reportingmanager"),
      mobile: get("mobile"),
      email: get("email"),
      personalEmail: get("personalemail"),
      dob: get("dob") || get("dateofbirth"),
      gender: (get("gender") as Employee["gender"]) || undefined,
      salary: get("salary"),
      address: get("address"),
      aadhaar: get("aadhaar"),
      pan: get("pan"),
      bankAccountName: get("bankaccountname"),
      accountNo: get("accountno") || get("accountnumber"),
      ifsc: get("ifsc"),
      bankName: get("bank") || get("bankname"),
      branch: get("branch"),
      emergencyContact: get("emergencycontact") || get("emgname"),
      emergencyPhone: get("emergencyphone") || get("emgphone"),
    };
  });
}

/**
 * Update a single employee row in Google Sheets.
 * rowNumber is the 1-based sheet row (header = 1, first data = 2).
 */
export async function updateEmployeeRow(
  employee: Partial<Employee> & { sheetRow: number },
  sheetTab = "Employees"
): Promise<void> {
  const sheets = await getSheetsClient();

  // Build a flat array of values matching column order A–Z
  const values = [
    employee.employeeId || "",
    employee.name || "",
    employee.designation || "",
    employee.department || "",
    employee.joiningDate || "",
    employee.lastWorkingDay || "",
    employee.status || "",
    employee.mode || "",
    employee.city || "",
    employee.manager || "",
    employee.mobile || "",
    employee.email || "",
    employee.personalEmail || "",
    employee.dob || "",
    employee.gender || "",
    employee.salary || "",
    employee.address || "",
    employee.aadhaar || "",
    employee.pan || "",
    employee.bankAccountName || "",
    employee.accountNo || "",
    employee.ifsc || "",
    employee.bankName || "",
    employee.branch || "",
    employee.emergencyContact || "",
    employee.emergencyPhone || "",
  ];

  const range = `${sheetTab}!A${employee.sheetRow}:Z${employee.sheetRow}`;

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [values] },
  });
}

/**
 * Append a new employee row at the bottom of the sheet.
 */
export async function appendEmployeeRow(
  employee: Partial<Employee>,
  sheetTab = "Employees"
): Promise<void> {
  const sheets = await getSheetsClient();

  const values = [
    employee.employeeId || "",
    employee.name || "",
    employee.designation || "",
    employee.department || "",
    employee.joiningDate || "",
    employee.lastWorkingDay || "",
    employee.status || "Active",
    employee.mode || "WFH",
    employee.city || "",
    employee.manager || "",
    employee.mobile || "",
    employee.email || "",
    employee.personalEmail || "",
    employee.dob || "",
    employee.gender || "",
    employee.salary || "",
    employee.address || "",
    employee.aadhaar || "",
    employee.pan || "",
    employee.bankAccountName || "",
    employee.accountNo || "",
    employee.ifsc || "",
    employee.bankName || "",
    employee.branch || "",
    employee.emergencyContact || "",
    employee.emergencyPhone || "",
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${sheetTab}!A:Z`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [values] },
  });
}

/**
 * Delete a row by clearing it and then shifting remaining rows up.
 * NOTE: This uses batchUpdate to delete the row entirely.
 */
export async function deleteEmployeeRow(
  sheetRow: number,
  sheetId: number = 0 // Sheet tab gid — 0 for first tab
): Promise<void> {
  const sheets = await getSheetsClient();

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: "ROWS",
              startIndex: sheetRow - 1, // 0-based
              endIndex: sheetRow,       // exclusive
            },
          },
        },
      ],
    },
  });
}

/**
 * Fetch leave balance data from "Leave" sheet tab.
 */
export async function fetchLeaveData(sheetTab = "Leave") {
  const sheets = await getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${sheetTab}!A1:J`,
  });
  return response.data.values || [];
}
