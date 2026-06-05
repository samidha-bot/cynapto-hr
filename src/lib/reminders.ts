/**
 * Reminder engine — called by the /api/reminders cron job (daily at 8am IST)
 * Checks birthdays, anniversaries, LWDs, internship ends, doc alerts, offboarding
 */
import {
  sendBirthdayEmail,
  sendAnniversaryEmail,
  sendLWDAlert,
  sendDocumentAlert,
  sendOffboardingAlert,
  sendFestivalEmail,
} from "./email";
import { fetchEmployeesFromSheet } from "./sheets";
import { adminDb } from "./firebase-admin";
import { parseISO, format, differenceInDays, differenceInYears, isFriday, isMonday, subDays } from "date-fns";

const HR_EMAIL = process.env.RESEND_FROM_EMAIL || "hr@cynapto.com";
const ANNIVERSARY_MILESTONES = [1, 3, 5, 10];

function parseSheetDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  // Supports DD/MM/YYYY and YYYY-MM-DD
  if (dateStr.includes("/")) {
    const [dd, mm, yyyy] = dateStr.split("/");
    return new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd));
  }
  try {
    return parseISO(dateStr);
  } catch {
    return null;
  }
}

/**
 * Determine alert date: if the actual date falls on Monday, alert on the preceding Friday.
 */
function getAlertDate(targetDate: Date): Date {
  if (isMonday(targetDate)) {
    return subDays(targetDate, 3); // Friday
  }
  return targetDate;
}

export async function runDailyReminders() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const employees = await fetchEmployeesFromSheet();
  const activeEmployees = employees.filter(
    (e) => e.status === "Active" || e.status === "Intern"
  );

  const results: string[] = [];

  for (const emp of employees) {
    // ── Birthday ───────────────────────────────────────────────────────────
    if (emp.dob && emp.email) {
      const dob = parseSheetDate(emp.dob);
      if (dob) {
        const thisYearBirthday = new Date(
          today.getFullYear(),
          dob.getMonth(),
          dob.getDate()
        );
        if (
          thisYearBirthday.getDate() === today.getDate() &&
          thisYearBirthday.getMonth() === today.getMonth()
        ) {
          await sendBirthdayEmail(emp.email, emp.name);
          results.push(`Birthday: ${emp.name}`);
        }
      }
    }

    // ── Work Anniversary ───────────────────────────────────────────────────
    if (emp.joiningDate && emp.email && emp.status === "Active") {
      const joined = parseSheetDate(emp.joiningDate);
      if (joined) {
        for (const milestone of ANNIVERSARY_MILESTONES) {
          const anniversaryDate = new Date(
            joined.getFullYear() + milestone,
            joined.getMonth(),
            joined.getDate()
          );
          if (
            anniversaryDate.getDate() === today.getDate() &&
            anniversaryDate.getMonth() === today.getMonth() &&
            anniversaryDate.getFullYear() === today.getFullYear()
          ) {
            await sendAnniversaryEmail(emp.email, emp.name, milestone);
            results.push(`Anniversary ${milestone}yr: ${emp.name}`);
          }
        }
      }
    }

    // ── Last Working Day alert (4 days before) ────────────────────────────
    if (emp.lastWorkingDay) {
      const lwd = parseSheetDate(emp.lastWorkingDay);
      if (lwd) {
        const alertDate = getAlertDate(lwd);
        const daysUntilAlert = differenceInDays(alertDate, today);

        // Fire alert on D-4 (or Friday if LWD is Monday)
        const isIntern = emp.status === "Intern";
        if (daysUntilAlert === 4) {
          await sendLWDAlert(HR_EMAIL, emp.name, emp.lastWorkingDay, 4, isIntern);
          results.push(`LWD alert: ${emp.name}`);
        }
      }
    }

    // ── Day-5 document alert ──────────────────────────────────────────────
    if (emp.joiningDate && (emp.status === "Active" || emp.status === "Intern")) {
      const joined = parseSheetDate(emp.joiningDate);
      if (joined) {
        const daysSinceJoining = differenceInDays(today, joined);
        if (daysSinceJoining === 5) {
          // Check Firestore for onboarding record
          const onboardRef = adminDb
            .collection("onboarding")
            .where("employeeId", "==", emp.employeeId);
          const snap = await onboardRef.get();

          if (!snap.empty) {
            const record = snap.docs[0].data();
            const missingDocs: string[] = [];
            if (!record.softCopyDocs) missingDocs.push("Soft copy documents");
            if (!record.hardCopyDocs) missingDocs.push("Hard copy documents");
            if (missingDocs.length > 0 && !record.alertSentDay5) {
              await sendDocumentAlert(
                HR_EMAIL,
                emp.name,
                emp.joiningDate,
                missingDocs
              );
              await snap.docs[0].ref.update({ alertSentDay5: true });
              results.push(`Doc alert day 5: ${emp.name}`);
            }
          }
        }
      }
    }

    // ── Offboarding alert (2 days before exit) ────────────────────────────
    if (emp.lastWorkingDay && emp.status !== "Active" && emp.status !== "Intern") {
      const exitDate = parseSheetDate(emp.lastWorkingDay);
      if (exitDate) {
        const alertDate = getAlertDate(exitDate);
        const daysUntilAlert = differenceInDays(alertDate, today);

        if (daysUntilAlert === 2) {
          // Get pending offboarding checklist items
          const offboardRef = adminDb
            .collection("offboarding")
            .where("employeeId", "==", emp.employeeId);
          const snap = await offboardRef.get();

          let pendingItems: string[] = [];
          if (!snap.empty) {
            const record = snap.docs[0].data();
            if (!record.alertSent) {
              pendingItems = (record.checklist || [])
                .filter((item: { done: boolean; label: string }) => !item.done)
                .map((item: { label: string }) => item.label);
              await sendOffboardingAlert(HR_EMAIL, emp.name, emp.lastWorkingDay, pendingItems);
              await snap.docs[0].ref.update({ alertSent: true });
              results.push(`Offboarding alert: ${emp.name}`);
            }
          }
        }
      }
    }
  }

  // ── Festival greetings ─────────────────────────────────────────────────────
  await checkFestivalGreetings(today, activeEmployees, results);

  return results;
}

// ─── Indian festival calendar ─────────────────────────────────────────────────
// Format: "MM-DD" for fixed dates; dynamic ones need year-specific logic
const FESTIVALS: { name: string; date: string; greeting: string }[] = [
  {
    name: "Diwali",
    date: "10-20", // approximate — update yearly
    greeting:
      "May the festival of lights bring happiness, prosperity, and joy to you and your family. Wishing you a very Happy Diwali! 🪔",
  },
  {
    name: "Christmas",
    date: "12-25",
    greeting:
      "Wishing you and your loved ones a Merry Christmas filled with warmth and joy! 🎄",
  },
  {
    name: "New Year",
    date: "01-01",
    greeting:
      "Wishing you a fantastic start to the New Year! May 2025 be filled with success and happiness. 🎆",
  },
  {
    name: "Holi",
    date: "03-14", // approximate — update yearly
    greeting:
      "May the colours of Holi bring joy, laughter, and beautiful memories. Happy Holi! 🎨",
  },
  {
    name: "Eid",
    date: "04-10", // approximate — update yearly
    greeting:
      "Eid Mubarak! May this special day bring peace, happiness, and prosperity to you and your family. 🌙",
  },
  {
    name: "Independence Day",
    date: "08-15",
    greeting:
      "Happy Independence Day! Proud to be Indian. Jai Hind! 🇮🇳",
  },
  {
    name: "Republic Day",
    date: "01-26",
    greeting:
      "Happy Republic Day! Let us celebrate the spirit of our great nation. 🇮🇳",
  },
];

async function checkFestivalGreetings(
  today: Date,
  employees: { email?: string; name: string }[],
  results: string[]
) {
  const monthDay = format(today, "MM-dd");

  for (const festival of FESTIVALS) {
    if (festival.date === monthDay) {
      const emails = employees
        .filter((e) => !!e.email)
        .map((e) => e.email as string);
      if (emails.length > 0) {
        await sendFestivalEmail(emails, festival.name, festival.greeting);
        results.push(`Festival: ${festival.name} to ${emails.length} employees`);
      }
    }
  }
}
