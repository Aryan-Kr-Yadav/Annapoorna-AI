"use client";

import { useEffect, useRef } from "react";
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
  Menu,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/i18n";

const NAV = [
  { href: "/dashboard", labelKey: "nav.dashboard", defaultLabel: "Dashboard", icon: LayoutDashboard },
  { href: "/farms", labelKey: "nav.farms", defaultLabel: "My Farms", icon: Tractor },
  { href: "/crop-planner", labelKey: "nav.crop_planner", defaultLabel: "Crop Planner", icon: Sprout },
  { href: "/crop-doctor", labelKey: "nav.crop_doctor", defaultLabel: "Crop Doctor", icon: Stethoscope },
  { href: "/assistant", labelKey: "nav.assistant", defaultLabel: "Annapoorna AI", icon: MessageCircle },
  { href: "/weather", labelKey: "nav.weather", defaultLabel: "Weather", icon: CloudSun },
  { href: "/market", labelKey: "nav.market", defaultLabel: "Market", icon: TrendingUp },
  { href: "/schemes", labelKey: "nav.schemes", defaultLabel: "Schemes", icon: Landmark },
  { href: "/analytics", labelKey: "nav.analytics", defaultLabel: "Analytics", icon: LineChart },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({
  collapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close mobile drawer on Escape key press
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && mobileOpen && onCloseMobile) {
        onCloseMobile();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen, onCloseMobile]);

  // Sidebar navigation links content
  const navContent = (
    <div className="flex h-full flex-col justify-between">
      <div>
        {/* Header / Logo */}
        <div className={cn("flex items-center gap-3 px-4 py-5", collapsed ? "justify-center" : "justify-between")}>
          <Link
            href="/dashboard"
            onClick={onCloseMobile}
            className="flex items-center gap-2.5 min-w-0"
            title="Annapoorna AI"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-emerald-600 text-white shadow-sm shadow-primary-200">
              <Sprout className="h-5 w-5" />
            </div>
            {!collapsed && (
              <span className="text-base font-bold tracking-tight text-primary-950 truncate">
                Annapoorna AI
              </span>
            )}
          </Link>

          {/* Desktop collapse toggle button */}
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="hidden md:flex h-7 w-7 items-center justify-center rounded-lg border border-primary-200 text-primary-500 hover:bg-primary-50 hover:text-primary-800 transition"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          )}

          {/* Mobile close button */}
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close navigation menu"
              className="flex md:hidden h-8 w-8 items-center justify-center rounded-lg text-primary-500 hover:bg-primary-50"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation list */}
        <nav className="space-y-1 px-2.5 pt-2">
          {NAV.map((item) => {
            const active = pathname?.startsWith(item.href);
            const label = t(item.labelKey, item.defaultLabel);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                title={collapsed ? label : undefined}
                className={cn(
                  "group flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                  collapsed ? "justify-center" : "gap-3",
                  active
                    ? "bg-primary-600 text-white shadow-sm shadow-primary-200"
                    : "text-primary-700 hover:bg-primary-50 hover:text-primary-900"
                )}
              >
                <item.icon
                  className={cn("h-4 w-4 shrink-0 transition-transform group-hover:scale-110", active ? "text-white" : "text-primary-600")}
                  strokeWidth={2}
                />
                {!collapsed && <span className="truncate">{label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / User Profile & Settings */}
      <div className="border-t border-primary-100 p-3 space-y-2">
        <Link
          href="/settings"
          onClick={onCloseMobile}
          title={collapsed ? t("nav.settings", "Settings") : undefined}
          className={cn(
            "flex items-center rounded-xl px-3 py-2 text-sm font-medium transition",
            collapsed ? "justify-center" : "gap-2.5",
            pathname?.startsWith("/settings")
              ? "bg-primary-100 text-primary-900 font-semibold"
              : "text-primary-600 hover:bg-primary-50 hover:text-primary-900"
          )}
        >
          <Settings className="h-4 w-4 shrink-0" />
          {!collapsed && <span>{t("nav.settings", "Settings")}</span>}
        </Link>

        <div className={cn("flex items-center pt-1", collapsed ? "justify-center" : "justify-between gap-2")}>
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-800">
              {(user?.name || user?.full_name || user?.email || "U").charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-primary-900">
                  {user?.name || user?.full_name || "Farmer"}
                </p>
                <p className="truncate text-[10px] text-primary-500">
                  {user?.email}
                </p>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={logout}
            aria-label={t("nav.logout", "Log out")}
            title={t("nav.logout", "Log out")}
            className="rounded-lg p-1.5 text-primary-400 hover:bg-red-50 hover:text-red-600 transition"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-primary-100 bg-white transition-all duration-300 ease-in-out shrink-0 sticky top-0 h-screen z-20",
          collapsed ? "w-20" : "w-60"
        )}
      >
        {navContent}
      </aside>

      {/* Mobile Drawer (Accessible overlay) */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 flex md:hidden animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Drawer content */}
          <div
            ref={drawerRef}
            className="relative z-50 h-full w-72 max-w-[85vw] bg-white shadow-2xl animate-in slide-in-from-left duration-250 ease-out"
          >
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}
