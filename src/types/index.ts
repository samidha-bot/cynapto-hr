// ─── Employee ────────────────────────────────────────────────────────────────
export interface Employee {
  id: string;                   // row index or CX ID
  employeeId: string;           // CX0001 etc.
  name: string;
  designation: string;
  department?: string;
  joiningDate: string;          // DD/MM/YYYY
  lastWorkingDay?: string;
  status: "Active" | "Inactive" | "Resigned" | "Terminated" | "Intern";
  mode: "WFH" | "Onsite" | "Hybrid";
  city?: string;
  manager?: string;
  mobile?: string;
  email?: string;
  personalEmail?: string;
  dob?: string;                 // DD/MM/YYYY
  gender?: "M" | "F" | "Other";
  salary?: string;
  address?: string;
  aadhaar?: string;
  pan?: string;
  bankName?: string;
  accountNo?: string;
  ifsc?: string;
  branch?: string;
  bankAccountName?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  // Row index in Google Sheets (1-based, skipping header)
  sheetRow?: number;
}

// ─── Leave ───────────────────────────────────────────────────────────────────
export interface LeaveRecord {
  employeeId: string;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  status: "Approved" | "Pending" | "Rejected";
  notes?: string;
}

export interface LeaveBalance {
  employeeId: string;
  employeeName: string;
  annual: number;
  sick: number;
  casual: number;
  used: number;
  remaining: number;
}

// ─── Onboarding / Offboarding ────────────────────────────────────────────────
export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
  doneAt?: string;
}

export interface OnboardingRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  joiningDate: string;
  softCopyDocs: boolean;
  hardCopyDocs: boolean;
  checklist: ChecklistItem[];
  alertSentDay5: boolean;
  createdAt: string;
}

export interface OffboardingRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  exitDate: string;
  checklist: ChecklistItem[];
  alertSent: boolean;
  createdAt: string;
}

// ─── Tasks ───────────────────────────────────────────────────────────────────
export type TaskStatus = "pending" | "in_progress" | "completed";
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  reminderSent?: boolean;
}

// ─── Announcements ───────────────────────────────────────────────────────────
export interface Announcement {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  createdBy: string;
  pinned?: boolean;
}

// ─── Suggestions ─────────────────────────────────────────────────────────────
export interface Suggestion {
  id: string;
  message: string;
  category?: string;
  submittedAt: string;
  read: boolean;
}

// ─── Calendar Event ──────────────────────────────────────────────────────────
export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  type: "interview" | "position_open" | "position_closed" | "other";
  description?: string;
  googleEventId?: string;
}

// ─── Reports ─────────────────────────────────────────────────────────────────
export interface AttritionData {
  month: string;
  joined: number;
  left: number;
  attritionRate: number;
}

export interface EngagementScore {
  id: string;
  quarter: string;
  year: number;
  score: number;
  notes?: string;
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export type UserRole = "admin" | "sub_admin";

export interface AppUser {
  uid: string;
  email: string;
  role: UserRole;
  displayName?: string;
}
