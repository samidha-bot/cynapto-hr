"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { clsx } from "clsx";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const NAV = [
  { href: "/dashboard", icon: "🏠", label: "Dashboard" },
  { href: "/dashboard/employees", icon: "👥", label: "Employees" },
  { href: "/dashboard/org-chart", icon: "🌳", label: "Org Chart" },
  { href: "/dashboard/leave", icon: "🏖️", label: "Leave" },
  { href: "/dashboard/onboarding", icon: "🆕", label: "Onboarding" },
  { href: "/dashboard/offboarding", icon: "🚪", label: "Offboarding" },
  { href: "/dashboard/calendar", icon: "📅", label: "Calendar" },
  { href: "/dashboard/tasks", icon: "✅", label: "Tasks", adminOnly: true },
  { href: "/dashboard/announcements", icon: "📢", label: "Announcements" },
  { href: "/dashboard/suggestions", icon: "📬", label: "Suggestions", adminOnly: true },
  { href: "/dashboard/reports", icon: "📊", label: "Reports" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    document.cookie = "cynapto_session=; path=/; max-age=0";
    router.replace("/login");
    toast.success("Logged out");
  }

  const isAdmin = user?.role === "admin";
  const filteredNav = NAV.filter((item) => !item.adminOnly || isAdmin);

  return (
    <aside className="fixed top-0 left-0 bottom-0 w-60 bg-slate-900 flex flex-col z-40 overflow-y-auto">
      <div className="px-4 py-5 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center text-lg">🎯</div>
          <div>
            <p className="text-white font-bold text-sm">Cynapto HR</p>
            <p className="text-slate-400 text-xs">People &amp; Culture</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-0.5">
        <p className="px-3 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Navigation</p>
        {filteredNav.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-600/20 text-white border-l-2 border-blue-500"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <span className="text-base leading-none">{item.icon}</span>
              <span>{item.label}</span>
              {item.adminOnly && (
                <span className="ml-auto text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">Admin</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-slate-700/50">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
            {user?.email?.[0]?.toUpperCase() || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-slate-200 text-xs font-semibold truncate">{user?.email}</p>
            <p className="text-slate-500 text-[11px] capitalize">
              {user?.role === "admin" ? "👑 Admin" : "👔 Manager"}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full text-left px-3 py-2 text-xs text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
        >
          🚪 Sign out
        </button>
      </div>
    </aside>
  );
}
