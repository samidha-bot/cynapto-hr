/**
 * Email service via Resend
 * All outbound emails go through this module
 */
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL || "hr@cynapto.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://cynapto-hr.vercel.app";

// ─── Generic send ─────────────────────────────────────────────────────────────
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string | string[];
  subject: string;
  html: string;
}) {
  return resend.emails.send({
    from: `Cynapto HR <${FROM}>`,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
  });
}

// ─── Birthday greeting ────────────────────────────────────────────────────────
export async function sendBirthdayEmail(
  employeeEmail: string,
  employeeName: string
) {
  const firstName = employeeName.split(" ")[0];
  return sendEmail({
    to: employeeEmail,
    subject: `🎂 Happy Birthday, ${firstName}! From Team Cynapto`,
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:32px;background:#fff;border-radius:12px;">
        <h1 style="color:#2563eb;font-size:28px;margin-bottom:8px">🎉 Happy Birthday!</h1>
        <p style="font-size:16px;color:#334155">Dear <strong>${employeeName}</strong>,</p>
        <p style="font-size:15px;color:#475569;line-height:1.7">
          Wishing you a wonderful birthday filled with joy, laughter, and all your favourite things!
          The entire Cynapto team is grateful to have you with us. Here's to another amazing year ahead! 🥳
        </p>
        <p style="font-size:15px;color:#475569">With warm wishes,<br/><strong>Team Cynapto</strong></p>
      </div>`,
  });
}

// ─── Work anniversary ─────────────────────────────────────────────────────────
export async function sendAnniversaryEmail(
  employeeEmail: string,
  employeeName: string,
  years: number
) {
  const firstName = employeeName.split(" ")[0];
  return sendEmail({
    to: employeeEmail,
    subject: `🏆 Congratulations on ${years} Year${years > 1 ? "s" : ""} at Cynapto!`,
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:32px;background:#fff;border-radius:12px;">
        <h1 style="color:#16a34a;font-size:26px">🏆 ${years} Year${years > 1 ? "s" : ""} at Cynapto!</h1>
        <p style="font-size:16px;color:#334155">Dear <strong>${employeeName}</strong>,</p>
        <p style="font-size:15px;color:#475569;line-height:1.7">
          Today marks <strong>${years} incredible year${years > 1 ? "s" : ""}</strong> of your journey with us.
          Your dedication, hard work, and contributions have been invaluable to the Cynapto family.
          We truly appreciate everything you bring to the team!
        </p>
        <p style="font-size:15px;color:#475569">With gratitude,<br/><strong>Samidha & Team Cynapto</strong></p>
      </div>`,
  });
}

// ─── Last working day / Internship end alert (to HR) ─────────────────────────
export async function sendLWDAlert(
  hrEmail: string,
  employeeName: string,
  lwdDate: string,
  daysLeft: number,
  isIntern: boolean
) {
  return sendEmail({
    to: hrEmail,
    subject: `⚠️ Reminder: ${employeeName} — ${isIntern ? "Internship" : "Last Working Day"} in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`,
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:32px;background:#fff;border-radius:12px;border-left:4px solid #d97706;">
        <h2 style="color:#d97706">⚠️ Upcoming Exit Alert</h2>
        <p style="font-size:15px;color:#334155">
          <strong>${employeeName}</strong>'s ${isIntern ? "internship" : "last working day"} is on
          <strong>${lwdDate}</strong> — that's <strong>${daysLeft} day${daysLeft !== 1 ? "s" : ""}</strong> from now.
        </p>
        <p style="font-size:14px;color:#64748b">Please ensure the offboarding checklist is complete.</p>
        <a href="${APP_URL}/offboarding" style="display:inline-block;margin-top:12px;padding:10px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-size:14px">
          Open Offboarding
        </a>
      </div>`,
  });
}

// ─── Document alert (day 5 after joining) ────────────────────────────────────
export async function sendDocumentAlert(
  hrEmail: string,
  employeeName: string,
  joiningDate: string,
  missingDocs: string[]
) {
  return sendEmail({
    to: hrEmail,
    subject: `📄 Document Reminder: ${employeeName} — Day 5 After Joining`,
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:32px;background:#fff;border-radius:12px;border-left:4px solid #2563eb;">
        <h2 style="color:#2563eb">📄 Documents Still Pending</h2>
        <p style="font-size:15px;color:#334155">
          <strong>${employeeName}</strong> joined on <strong>${joiningDate}</strong> and it's now Day 5.
          The following documents are still pending:
        </p>
        <ul style="font-size:14px;color:#475569">
          ${missingDocs.map((d) => `<li>${d}</li>`).join("")}
        </ul>
        <a href="${APP_URL}/onboarding" style="display:inline-block;margin-top:12px;padding:10px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-size:14px">
          Open Onboarding
        </a>
      </div>`,
  });
}

// ─── Offboarding alert (2 days before exit) ──────────────────────────────────
export async function sendOffboardingAlert(
  hrEmail: string,
  employeeName: string,
  exitDate: string,
  pendingItems: string[]
) {
  return sendEmail({
    to: hrEmail,
    subject: `🚪 Offboarding Alert: ${employeeName} — Exit in 2 Days`,
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:32px;background:#fff;border-radius:12px;border-left:4px solid #dc2626;">
        <h2 style="color:#dc2626">🚪 Offboarding in 2 Days</h2>
        <p style="font-size:15px;color:#334155">
          <strong>${employeeName}</strong>'s exit date is <strong>${exitDate}</strong>.
          The following offboarding items are still pending:
        </p>
        <ul style="font-size:14px;color:#475569">
          ${pendingItems.length > 0 ? pendingItems.map((i) => `<li>${i}</li>`).join("") : "<li>All items complete ✅</li>"}
        </ul>
        <a href="${APP_URL}/offboarding" style="display:inline-block;margin-top:12px;padding:10px 20px;background:#dc2626;color:#fff;text-decoration:none;border-radius:8px;font-size:14px">
          Open Offboarding
        </a>
      </div>`,
  });
}

// ─── Festival greeting ────────────────────────────────────────────────────────
export async function sendFestivalEmail(
  emails: string[],
  festival: string,
  greeting: string
) {
  return sendEmail({
    to: emails,
    subject: `🎊 ${festival} Wishes from Team Cynapto!`,
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:32px;background:#fff;border-radius:12px;">
        <h1 style="color:#7c3aed;font-size:26px">🎊 ${festival}</h1>
        <p style="font-size:15px;color:#475569;line-height:1.7">${greeting}</p>
        <p style="font-size:15px;color:#475569">Warm wishes,<br/><strong>Team Cynapto</strong></p>
      </div>`,
  });
}

// ─── Suggestion box invitation (to employees) ────────────────────────────────
export async function sendSuggestionBoxEmail(
  emails: string[],
  customMessage?: string
) {
  const link = `${APP_URL}/suggest`;
  return sendEmail({
    to: emails,
    subject: "📬 Share Your Thoughts — Anonymous Suggestion Box",
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:32px;background:#fff;border-radius:12px;border-left:4px solid #7c3aed;">
        <h2 style="color:#7c3aed">📬 We Want to Hear From You</h2>
        ${customMessage ? `<p style="font-size:15px;color:#334155">${customMessage}</p>` : ""}
        <p style="font-size:15px;color:#475569;line-height:1.7">
          Your voice matters! Share your ideas, feedback, or suggestions — completely anonymously.
          No login required. No names. Nothing is tracked.
        </p>
        <a href="${link}" style="display:inline-block;margin-top:16px;padding:12px 28px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;">
          Submit Anonymously →
        </a>
        <p style="font-size:12px;color:#94a3b8;margin-top:16px">This form does not collect your name, email, or IP address.</p>
      </div>`,
  });
}
