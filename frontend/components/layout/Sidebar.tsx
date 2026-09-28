"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Tractor,
  Sprout,
  MessageCircle,
  Stethoscope,
  CloudSun,
  Landmark,
  TrendingUp,
  LineChart,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/farms", label: "My Farms", icon: Tractor },
  { href: "/assistant", label: "KrishiMitra AI", icon: MessageCircle },
  { href: "/crop-doctor", label: "Crop Doctor", icon: Stethoscope },
  { href: "/weather", label: "Weather", icon: CloudSun },
  { href: "/schemes", label: "Schemes", icon: Landmark },
  { href: "/market", label: "Market", icon: TrendingUp },
  { href: "/analytics", label: "Analytics", icon: LineChart },
  { href: "/crop-planner", label: "Crop Planner", icon: Sprout },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-primary-100 bg-white md:flex">
      <div className="flex items-center gap-2 px-5 py-5">
        <Sprout className="h-6 w-6 text-primary-600" />
        <span className="text-lg font-semibold text-primary-900">KrishiMitra</span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                active ? "bg-primary-100 text-primary-800" : "text-primary-600 hover:bg-primary-50"
              )}
            >
              <item.icon className="h-4 w-4" strokeWidth={1.75} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-primary-100 px-4 py-4">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-2 text-sm font-medium",
            pathname?.startsWith("/settings") ? "text-primary-800" : "text-primary-500 hover:text-primary-700"
          )}
        >
          <Settings className="h-4 w-4" /> Settings
        </Link>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-medium text-primary-800">
              {(user?.name || user?.full_name || user?.email || "?").charAt(0).toUpperCase()}
            </div>
            <span className="truncate text-xs text-primary-600">{user?.name || user?.full_name || user?.email}</span>
          </div>
          <button onClick={logout} title="Log out" className="rounded-md p-1.5 text-primary-500 hover:bg-primary-50">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
