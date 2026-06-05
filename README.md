# 🎯 Cynapto HR Automation System

A fully-featured HR Management Web Application built with **Next.js 14**, **Firebase**, **Google Sheets API**, **Google Calendar API**, and **Resend** for automated email.

---

## 📋 Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | Employee Database | Two-way sync with Google Sheets |
| 2 | Automated Email Reminders | Birthdays, anniversaries, LWDs, festivals |
| 3 | Org Chart | Auto-generated from Manager column |
| 4 | Google Calendar | Interview schedules, open/closed positions |
| 5 | Reports & Analytics | Attrition, joiners/leavers, export PDF/Excel |
| 6 | Anonymous Suggestion Box | No IP logging, no login required |
| 7 | Announcements | Company updates for all users |
| 8 | Leave Dashboard | Read from Google Sheets Leave tab |
| 9 | Onboarding Checklist | Doc tracking, day-5 alert |
| 10 | Offboarding Checklist | Exit tasks, 2-day alert |
| 11 | Task Management | HR follow-ups, deadlines, priorities |
| 12 | Weekly Motivational Quotes | Auto-rotated on dashboard |
| 13 | Festival & Birthday Greetings | Auto-sent via email |

---

## 🚀 Quick Start — Deploy in 4 Steps

### Step 1: Set Up GitHub

1. Install Git from https://git-scm.com/download/win
2. Create a GitHub account at https://github.com
3. Create a new repository named `cynapto-hr-app` (public or private)
4. Open Command Prompt in the `cynapto-hr-app` folder and run:
   ```
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/cynapto-hr-app.git
   git push -u origin main
   ```

### Step 2: Set Up Firebase

1. Go to https://console.firebase.google.com
2. Click **"Add project"** → Name it `cynapto-hr`
3. Enable **Google Analytics** (optional) → Create project

**Firebase Authentication:**
1. Go to Authentication → Get started → Email/Password → Enable
2. Go to Users tab → Add user:
   - HR Admin: `samidha@cynapto.com` + a strong password
   - Manager: `manager@cynapto.com` + a password
3. Note down both UIDs

**Firestore Database:**
1. Go to Firestore Database → Create database → Start in production mode → `asia-south1`
2. Go to Rules tab → Paste the content from `firestore.rules` → Publish
3. Go to **Cloud Firestore** → Create collection `users`
4. Add document with **Document ID = HR Admin's UID**:
   - Field: `role` = `admin` (String)
   - Field: `email` = `samidha@cynapto.com` (String)
5. Add document with **Document ID = Manager's UID**:
   - Field: `role` = `sub_admin` (String)
   - Field: `email` = `manager@cynapto.com` (String)

**Get Firebase Config:**
1. Project Settings → General → Your apps → Add web app
2. Name it `cynapto-hr-web` → Register
3. Copy the `firebaseConfig` values — you'll need them for `.env`

**Firebase Admin SDK:**
1. Project Settings → Service accounts → Generate new private key
2. Download the JSON file — you need `project_id`, `client_email`, `private_key`

**Firebase Storage:**
- Storage → Get started → Start in test mode → `asia-south1`

---

### Step 3: Set Up Google APIs (One dedicated Google account)

Create or use a dedicated Google account (e.g., `cynapto.hr.api@gmail.com`) for all API access.

**Google Sheets:**
1. Go to https://console.cloud.google.com
2. Create a new project → Enable **Google Sheets API** and **Google Calendar API**
3. Create a **Service Account**:
   - IAM & Admin → Service Accounts → Create
   - Name: `cynapto-hr-service`
   - Grant role: Editor
4. Create a key → JSON → Download
5. From the JSON file, copy `client_email` and `private_key`
6. **Share your Google Sheet** with the service account email (Editor access)
7. Get the Sheet ID from the URL:
   `https://docs.google.com/spreadsheets/d/**SHEET_ID**/edit`

**Google Sheet Setup — Required Tabs:**
Create these tabs in your Google Sheet:
- `Employees` — main employee data (see column list below)
- `Leave` — leave records
- `Interns` — (optional, can filter from Employees by Status=Intern)

**Employee Sheet Columns (Row 1 headers — exactly these names):**
```
EmployeeId | Name | Designation | Department | JoiningDate | LastWorkingDay | Status | Mode | City | Manager | Mobile | Email | PersonalEmail | DOB | Gender | Salary | Address | Aadhaar | PAN | BankAccountName | AccountNo | IFSC | BankName | Branch | EmergencyContact | EmergencyPhone
```

**Google Calendar:**
1. Go to calendar.google.com with the HR Admin account
2. Share the HR calendar with the service account email (Make changes to events)
3. Get the Calendar ID from Settings → Specific Calendar → Calendar ID

---

### Step 4: Set Up Resend (Email)

1. Go to https://resend.com → Sign up free
2. Domains → Add domain → `cynapto.com`
3. Follow DNS verification steps (add 3 DNS records to your domain)
4. API Keys → Create API key → Copy it

---

### Step 5: Deploy to Vercel

1. Go to https://vercel.com → Sign up with GitHub
2. Import your `cynapto-hr-app` repository
3. **Environment Variables** — Add all of these in Vercel Project Settings:

```
NEXT_PUBLIC_FIREBASE_API_KEY         = (from Firebase web app config)
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN     = cynapto-hr.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID      = cynapto-hr
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET  = cynapto-hr.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = (from config)
NEXT_PUBLIC_FIREBASE_APP_ID          = (from config)

FIREBASE_ADMIN_PROJECT_ID            = cynapto-hr
FIREBASE_ADMIN_CLIENT_EMAIL          = (from service account JSON)
FIREBASE_ADMIN_PRIVATE_KEY           = (full private key with \n — wrap in quotes)

GOOGLE_SERVICE_ACCOUNT_EMAIL         = cynapto-hr-service@...iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY   = (from Google service account JSON)
GOOGLE_SHEETS_ID                     = (your Sheet ID)
GOOGLE_CALENDAR_ID                   = hr@cynapto.com

RESEND_API_KEY                       = re_xxxxxxxxxxxx
RESEND_FROM_EMAIL                    = hr@cynapto.com

NEXT_PUBLIC_APP_URL                  = https://cynapto-hr.vercel.app
CRON_SECRET                          = (generate a random 32-char string)
```

4. Deploy → Your app goes live!

---

## 📧 How Email Reminders Work

The cron job runs **every day at 8:00 AM IST** (2:30 AM UTC), checking:

| Trigger | When |
|---------|------|
| Birthday | On the birthday |
| Work Anniversary | On 1, 3, 5, 10 year anniversary |
| Intern LWD alert | 4 days before (Friday if LWD is Monday) |
| Employee LWD alert | 4 days before (Friday if LWD is Monday) |
| Day-5 doc alert | If docs still pending on day 5 after joining |
| Offboarding alert | 2 days before exit (Friday if exit is Monday) |
| Festival greetings | On the festival day |

To test reminders manually, call:
```
GET https://your-app.vercel.app/api/reminders?secret=YOUR_CRON_SECRET
```

---

## 🔐 User Roles

| Role | Access |
|------|--------|
| **HR Admin (Samidha)** | Full access — add, edit, delete, view sensitive data, manage all features |
| **Manager Sub-Admin** | Read-only access to all data and reports |

---

## 📊 Google Sheet Structure

### Employees tab columns:
The app auto-maps columns by header name. Make sure your headers match (case-insensitive, spaces OK):

`EmployeeId`, `Name`, `Designation`, `Department`, `JoiningDate`, `LastWorkingDay`, `Status`, `Mode`, `City`, `Manager`, `Mobile`, `Email`, `PersonalEmail`, `DOB`, `Gender`, `Salary`, `Address`, `Aadhaar`, `PAN`, `BankAccountName`, `AccountNo`, `IFSC`, `BankName`, `Branch`, `EmergencyContact`, `EmergencyPhone`

### Leave tab columns:
`EmployeeId`, `EmployeeName`, `LeaveType`, `StartDate`, `EndDate`, `Days`, `Status`, `Notes`

---

## 📁 Project Structure

```
src/
├── app/
│   ├── (dashboard)/          # All HR dashboard pages (require login)
│   │   ├── page.tsx          # Dashboard home
│   │   ├── employees/        # Employee database
│   │   ├── org-chart/        # Organization chart
│   │   ├── calendar/         # Google Calendar
│   │   ├── reports/          # Analytics & exports
│   │   ├── suggestions/      # Anonymous suggestion inbox
│   │   ├── announcements/    # Company updates
│   │   ├── leave/            # Leave dashboard
│   │   ├── onboarding/       # New joiner checklists
│   │   ├── offboarding/      # Exit checklists
│   │   └── tasks/            # HR task management
│   ├── login/                # Login page
│   ├── suggest/              # Public anonymous suggestion form
│   └── api/                  # Backend API routes
│       ├── sheets/           # Google Sheets CRUD
│       ├── calendar/         # Google Calendar
│       ├── reminders/        # Daily cron job
│       └── suggestions/      # Anonymous submissions
├── lib/
│   ├── firebase.ts           # Firebase client
│   ├── firebase-admin.ts     # Firebase Admin SDK
│   ├── sheets.ts             # Google Sheets API
│   ├── calendar.ts           # Google Calendar API
│   ├── email.ts              # Resend email functions
│   ├── reminders.ts          # Daily reminder logic
│   └── quotes.ts             # Motivational quotes
├── hooks/
│   └── useAuth.ts            # Firebase auth hook
├── types/
│   └── index.ts              # TypeScript interfaces
└── middleware.ts             # Route protection
```

---

## 🔄 Making Changes Later

To update the app after making code changes:
```bash
git add .
git commit -m "your change description"
git push
```
Vercel automatically deploys from GitHub — no extra steps needed.

---

## 🆘 Troubleshooting

**"Calendar not configured"** — Check `GOOGLE_CALENDAR_ID` and that the service account has Editor access to that calendar.

**Emails not sending** — Verify `RESEND_API_KEY` and that your domain is verified in Resend.

**Google Sheets not loading** — Make sure the sheet is shared with the service account email.

**Login not working** — Check Firebase Auth has email/password enabled and the user exists.

**Reminders not running** — Vercel Cron requires a Pro plan. Alternatively, call the endpoint manually or use a free cron service like cron-job.org to hit `GET /api/reminders?secret=YOUR_SECRET` daily.

---

*Built for Cynapto's People & Culture team by Claude — June 2026*
