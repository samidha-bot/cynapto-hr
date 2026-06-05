"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getWeeklyQuote } from "@/lib/quotes";
import Link from "next/link";
import { Employee } from "@/types";
import { format, differenceInDays, parseISO } from "date-fns";

interface DashStats {
  active: number;
  interns: number;
  inactive: number;
  upcomingBirthdays: { name: string; date: string; daysLeft: number }[];
  upcomingAnniversaries: { name: string; years: number; date: string }[];
  upcomingLWDs: { name: string; lwd: string; daysLeft: number; isIntern: boolean }[];
  recentJoinees: Employee[];
}

function parseDate(str?: string): Date | null {
  if (!str) return null;
  if (str.includes("/")) {
    const [dd, mm, yyyy] = str.split("/");
    return new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd));
  }
  try { return parseISO(str); } catch { return null; }
}

export default function DashboardPage() {
  const { user } = useAuth();
  const quote = getWeeklyQuote();
  const [stats, setStats] = useState<DashStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/sheets?tab=Employees");
        if (!res.ok) throw new Error("Failed");
        const employees: Employee[] = await res.json();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const active = employees.filter((e) => e.status === "Active");
        const interns = employees.filter((e) => e.status === "Intern");
        const inactive = employees.filter(
          (e) => e.status === "Inactive" || e.status === "Resigned" || e.status === "Terminated"
        );

        // Birthdays in next 14 days
        const upcomingBirthdays = active
          .concat(interns)
          .filter((e) => e.dob)
          .map((e) => {
            const dob = parseDate(e.dob);
            if (!dob) return null;
            const next = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
            if (next < today) next.setFullYear(today.getFullYear() + 1);
            const daysLeft = differenceInDays(next, today);
            return daysLeft <= 14
              ? { name: e.name, date: `${dob.getDate()}/${dob.getMonth() + 1}`, daysLeft }
              : null;
          })
          .filter(Boolean) as { name: string; date: string; daysLeft: number }[];

        // Anniversaries (1, 3, 5, 10 yr) in next 30 days
        const upcomingAnniversaries = active
          .filter((e) => e.joiningDate)
          .flatMap((e) => {
            const joined = parseDate(e.joiningDate);
            if (!joined) return [];
            return [1, 3, 5, 10].map((y) => {
              const anniv = new Date(joined.getFullYear() + y, joined.getMonth(), joined.getDate());
              if (anniv.getFullYear() !== today.getFullYear()) return null;
              const diff = differenceInDays(anniv, today);
              return diff >= 0 && diff <= 30
                ? { name: e.name, years: y, date: `${anniv.getDate()}/${anniv.getMonth() + 1}` }
                : null;
            }).filter(Boolean) as { name: string; years: number; date: string }[];
          });

        // Upcoming LWDs (next 15 days)
        const upcomingLWDs = employees
          .filter((e) => e.lastWorkingDay)
          .map((e) => {
            const lwd = parseDate(e.lastWorkingDay);
            if (!lwd) return null;
            const daysLeft = differenceInDays(lwd, today);
            return daysLeft >= 0 && daysLeft <= 15
              ? { name: e.name, lwd: e.lastWorkingDay!, daysLeft, isIntern: e.status === "Intern" }
              : null;
          })
          .filter(Boolean) as { name: string; lwd: string; daysLeft: number; isIntern: boolean }[];

        // Recent joinees (last 90 days)
        const recentJoinees = active
          .filter((e) => {
            const d = parseDate(e.joiningDate);
            return d && differenceInDays(today, d) <= 90;
          })
          .sort((a, b) => {
            const da = parseDate(a.joiningDate)!.getTime();
            const db = parseDate(b.joiningDate)!.getTime();
            return db - da;
          })
          .slice(0, 5);

        setStats({
          active: active.length,
          interns: interns.length,
          inactive: inactive.length,
          upcomingBirthdays,
          upcomingAnniversaries,
          upcomingLWDs,
          recentJoinees,
        });
      } catch {
        setStats(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const firstName = user?.email?.split("@")[0] || "Samidha";
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {greeting}, {firstName.charAt(0).toUpperCase() + firstName.slice(1)}! 👋
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {format(new Date(), "EEEE, dd MMMM yyyy")}
          </p>
        </div>
        <div className="text-sm text-slate-500 bg-white border border-slate-200 rounded-xl px-4 py-2">
          {user?.role === "admin" ? "👑 HR Admin" : "👔 Manager View"}
        </div>
      </div>

      {/* Weekly Quote */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-5 text-white">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-200 mb-2">
          💡 Quote of the Week
        </p>
        <blockquote className="text-lg font-medium leading-relaxed">
          "{quote.text}"
        </blockquote>
        <p className="text-blue-300 text-sm mt-2">— {quote.author}</p>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/2 mb-3" />
              <div className="h-8 bg-slate-200 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon="👥" label="Active Employees" value={stats.active} color="blue" href="/employees" />
          <StatCard icon="🎓" label="Interns" value={stats.interns} color="purple" href="/employees?filter=intern" />
          <StatCard icon="📋" label="Inactive / Alumni" value={stats.inactive} color="orange" href="/employees?filter=inactive" />
          <StatCard icon="🎂" label="Birthdays Soon" value={stats.upcomingBirthdays.length} color="pink" />
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reminders column */}
        <div className="lg:col-span-2 space-y-4">
          {/* LWD Alerts */}
          {stats?.upcomingLWDs && stats.upcomingLWDs.length > 0 && (
            <WidgetCard title="⏰ Upcoming Exits" href="/offboarding">
              {stats.upcomingLWDs.map((l, i) => (
                <AlertRow
                  key={i}
                  color={l.daysLeft <= 4 ? "red" : "amber"}
                  text={`${l.name} — ${l.isIntern ? "Internship" : "LWD"}: ${l.lwd}`}
                  sub={`${l.daysLeft} day${l.daysLeft !== 1 ? "s" : ""} left`}
                />
              ))}
            </WidgetCard>
          )}

          {/* Birthdays */}
          {stats?.upcomingBirthdays && stats.upcomingBirthdays.length > 0 && (
            <WidgetCard title="🎂 Upcoming Birthdays">
              {stats.upcomingBirthdays
                .sort((a, b) => a.daysLeft - b.daysLeft)
                .map((b, i) => (
                  <AlertRow
                    key={i}
                    color={b.daysLeft === 0 ? "green" : "blue"}
                    text={`${b.name} — ${b.date}`}
                    sub={b.daysLeft === 0 ? "🎉 Today!" : `in ${b.daysLeft} day${b.daysLeft !== 1 ? "s" : ""}`}
                  />
                ))}
            </WidgetCard>
          )}

          {/* Anniversaries */}
          {stats?.upcomingAnniversaries && stats.upcomingAnniversaries.length > 0 && (
            <WidgetCard title="🏆 Work Anniversaries This Month">
              {stats.upcomingAnniversaries.map((a, i) => (
                <AlertRow
                  key={i}
                  color="purple"
                  text={`${a.name} — ${a.years} Year${a.years > 1 ? "s" : ""}`}
                  sub={a.date}
                />
              ))}
            </WidgetCard>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Recent Joinees */}
          <WidgetCard title="👋 Recent Joinees (90 days)">
            {stats?.recentJoinees.length ? (
              stats.recentJoinees.map((e, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {e.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{e.name}</p>
                    <p className="text-xs text-slate-500">{e.designation} · {e.joiningDate}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 py-2">No recent joinees</p>
            )}
          </WidgetCard>

          {/* Quick Links */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-sm font-semibold text-slate-700 mb-3">⚡ Quick Actions</p>
            <div className="space-y-2">
              {[
                { href: "/employees", label: "Add Employee", icon: "➕" },
                { href: "/onboarding", label: "Onboarding Checklist", icon: "📋" },
                { href: "/tasks", label: "Create Task", icon: "✅" },
                { href: "/announcements", label: "Post Announcement", icon: "📢" },
                { href: "/suggestions", label: "View Suggestions", icon: "📬" },
              ].map((q) => (
                <Link
                  key={q.href}
                  href={q.href}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <span>{q.icon}</span>
                  <span>{q.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
  href,
}: {
  icon: string;
  label: string;
  value: number;
  color: "blue" | "purple" | "orange" | "pink" | "green";
  href?: string;
}) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-700",
    purple: "bg-purple-50 text-purple-700",
    orange: "bg-orange-50 text-orange-700",
    pink: "bg-pink-50 text-pink-700",
    green: "bg-green-50 text-green-700",
  };
  const card = (
    <div className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl text-xl ${colorMap[color]} mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-xs text-slate-500 font-medium mt-0.5">{label}</p>
    </div>
  );
  return href ? <Link href={href}>{card}</Link> : card;
}

function WidgetCard({
  title,
  children,
  href,
}: {
  title: string;
  children: React.ReactNode;
  href?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        {href && (
          <Link href={href} className="text-xs text-blue-600 hover:underline">
            View all
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

function AlertRow({
  color,
  text,
  sub,
}: {
  color: "red" | "amber" | "blue" | "green" | "purple";
  text: string;
  sub: string;
}) {
  const colorMap = {
    red: "bg-red-50 border-red-200 text-red-800",
    amber: "bg-amber-50 border-amber-200 text-amber-800",
    blue: "bg-blue-50 border-blue-200 text-blue-800",
    green: "bg-green-50 border-green-200 text-green-800",
    purple: "bg-purple-50 border-purple-200 text-purple-800",
  };
  return (
    <div className={`flex items-center justify-between px-3 py-2 rounded-lg border mb-2 ${colorMap[color]}`}>
      <span className="text-sm font-medium">{text}</span>
      <span className="text-xs ml-3 whitespace-nowrap">{sub}</span>
    </div>
  );
}
