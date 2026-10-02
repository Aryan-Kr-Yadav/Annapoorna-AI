import React, { useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Tractor,
  Stethoscope,
  Bot,
  CloudSun,
  TrendingUp,
  Landmark,
  CheckSquare,
  Droplets,
  FlaskConical,
  BarChart3,
  Compass,
  Settings,
  LogOut,
  X,
  Sprout,
} from "lucide-react";
import { useTranslation } from "../../contexts/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import { cn } from "../../utils/cn";

export function Sidebar({
  collapsed = false,
  onToggleCollapse = () => {},
  mobileOpen = false,
  onCloseMobile = () => {},
}) {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Close mobile drawer on Escape
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && mobileOpen) {
        onCloseMobile();
      }
    }
    if (mobileOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen, onCloseMobile]);

  const navItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: t("nav.dashboard", "Dashboard") },
    { to: "/farms", icon: Tractor, label: t("nav.farms", "My Farms") },
    { to: "/crop-doctor", icon: Stethoscope, label: t("nav.crop_doctor", "Crop Doctor") },
    { to: "/assistant", icon: Bot, label: t("nav.assistant", "Annapoorna AI") },
    { to: "/weather", icon: CloudSun, label: t("nav.weather", "Weather") },
    { to: "/tasks", icon: CheckSquare, label: t("nav.tasks", "Tasks") },
    { to: "/irrigation", icon: Droplets, label: t("nav.irrigation", "Irrigation") },
    { to: "/soil", icon: FlaskConical, label: t("nav.soil", "Soil Health") },
    { to: "/market", icon: TrendingUp, label: t("nav.market", "Mandi Rates") },
    { to: "/schemes", icon: Landmark, label: t("nav.schemes", "Government Schemes") },
    { to: "/analytics", icon: BarChart3, label: t("nav.analytics", "Analytics") },
    { to: "/crop-planner", icon: Compass, label: t("nav.crop_planner", "Crop Planner") },
    { to: "/settings", icon: Settings, label: t("nav.settings", "Settings") },
  ];

  const handleNavClick = () => {
    if (mobileOpen) {
      onCloseMobile();
    }
  };

  const navContent = (
    <div className="flex h-full flex-col justify-between py-4 select-none">
      <div className="space-y-4">
        {/* Brand Header for Mobile Drawer only */}
        {mobileOpen && (
          <div className="flex items-center justify-between px-3.5 pb-3 border-b border-primary-100 dark:border-primary-900/40">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-600 text-white shadow-xs">
                <Sprout className="h-5 w-5" />
              </div>
              <span className="font-extrabold text-sm text-primary-950 dark:text-primary-50 tracking-tight block">
                Annapoorna AI
              </span>
            </div>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={onCloseMobile}
              className="flex md:hidden h-8 w-8 items-center justify-center rounded-lg border border-primary-200 dark:border-primary-800 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="space-y-1 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={handleNavClick}
                title={collapsed && !mobileOpen ? item.label : undefined}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition group",
                    isActive
                      ? "bg-primary-600 text-white shadow-xs dark:bg-primary-500"
                      : "text-stone-700 dark:text-stone-300 hover:bg-primary-50 dark:hover:bg-primary-900/40 hover:text-primary-900 dark:hover:text-primary-100",
                    collapsed && !mobileOpen && "justify-center px-2"
                  )
                }
              >
                <Icon className="h-4.5 w-4.5 shrink-0 stroke-[1.8]" />
                {(!collapsed || mobileOpen) && (
                  <span className="truncate">{item.label}</span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Logout button */}
      <div className="px-2 pt-3 border-t border-primary-100 dark:border-primary-900/40">
        <button
          type="button"
          onClick={() => {
            logout();
            handleNavClick();
          }}
          title={collapsed && !mobileOpen ? t("nav.logout", "Log Out") : undefined}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer",
            collapsed && !mobileOpen && "justify-center px-2"
          )}
        >
          <LogOut className="h-4.5 w-4.5 shrink-0 stroke-[1.8]" />
          {(!collapsed || mobileOpen) && <span>{t("nav.logout", "Log Out")}</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-primary-100 dark:border-primary-900/40 bg-white/90 dark:bg-[#121911]/90 backdrop-blur-md transition-all duration-200 sticky top-14 sm:top-15 h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-3.75rem)] z-20 overflow-y-auto",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {navContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-stone-900/60 dark:bg-black/75 backdrop-blur-2xs md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile Drawer Panel */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-[#121911] border-r border-primary-100 dark:border-primary-900/50 shadow-2xl transition-transform duration-250 ease-out md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {navContent}
      </aside>
    </>
  );
}

export default Sidebar;
