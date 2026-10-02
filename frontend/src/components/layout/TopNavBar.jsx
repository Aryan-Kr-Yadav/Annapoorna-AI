import React from "react";
import { Link } from "react-router-dom";
import { Menu, Sprout, Bell, Sun, Moon, Monitor, User } from "lucide-react";
import { FarmCropSelector } from "./FarmCropSelector";
import { useTranslation } from "../../contexts/LanguageContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";

export function TopNavBar({
  onToggleMobile,
  onToggleDesktop,
  isDesktopCollapsed,
}) {
  const { language, setLanguage } = useTranslation();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { user } = useAuth();

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 sm:h-15 w-full items-center justify-between border-b border-primary-100 dark:border-primary-900/40 bg-white/95 dark:bg-[#121911]/95 px-3 sm:px-6 backdrop-blur-md">
      {/* Left: Hamburger & Brand */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={onToggleMobile}
          aria-label="Open mobile navigation drawer"
          className="flex md:hidden h-8.5 w-8.5 items-center justify-center rounded-xl border border-primary-200 dark:border-primary-800 text-primary-800 dark:text-primary-200 hover:bg-primary-50 dark:hover:bg-primary-900/40 transition"
        >
          <Menu className="h-4.5 w-4.5" />
        </button>

        {/* Desktop Collapse Button (Three lines synchronized with brand) */}
        <button
          type="button"
          onClick={onToggleDesktop}
          aria-label={isDesktopCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={isDesktopCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden md:flex h-8.5 w-8.5 items-center justify-center rounded-xl border border-primary-200 dark:border-primary-800 text-primary-800 dark:text-primary-200 hover:bg-primary-50 dark:hover:bg-primary-900/40 transition shadow-2xs"
        >
          <Menu className="h-4 w-4" />
        </button>

        {/* Brand logo synchronized with three lines button */}
        <Link
          to="/dashboard"
          className="flex items-center gap-2 font-bold text-primary-950 dark:text-primary-50 text-sm sm:text-base tracking-tight hover:opacity-90 transition"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-600 dark:bg-primary-500 text-white shadow-xs">
            <Sprout className="h-5 w-5" />
          </div>
          <span className="font-extrabold text-sm sm:text-base tracking-tight">Annapoorna AI</span>
        </Link>
      </div>

      {/* Middle: Active Farm + Crop Context */}
      <div className="flex items-center mx-2">
        <FarmCropSelector />
      </div>

      {/* Right: Quick Tools (Notifications, Language, Theme, Profile) */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Language switch button */}
        <button
          type="button"
          onClick={() => setLanguage(language === "en" ? "hi" : "en")}
          className="flex h-8 px-2.5 items-center justify-center rounded-xl border border-primary-200 dark:border-primary-800 text-2xs font-bold uppercase tracking-wider text-primary-800 dark:text-primary-200 hover:bg-primary-50 dark:hover:bg-primary-900/40 transition shadow-2xs"
          title="Switch Language"
        >
          {language === "en" ? "हिन्दी" : "EN"}
        </button>

        {/* Theme button */}
        <button
          type="button"
          onClick={cycleTheme}
          aria-label="Toggle display theme"
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-primary-200 dark:border-primary-800 text-primary-800 dark:text-primary-200 hover:bg-primary-50 dark:hover:bg-primary-900/40 transition shadow-2xs"
          title={`Current theme: ${theme}. Click to switch.`}
        >
          {theme === "system" ? (
            <Monitor className="h-3.5 w-3.5" />
          ) : resolvedTheme === "dark" ? (
            <Moon className="h-3.5 w-3.5" />
          ) : (
            <Sun className="h-3.5 w-3.5" />
          )}
        </button>

        {/* Notifications button */}
        <Link
          to="/notifications"
          aria-label="View notifications"
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-primary-200 dark:border-primary-800 text-primary-800 dark:text-primary-200 hover:bg-primary-50 dark:hover:bg-primary-900/40 transition shadow-2xs"
          title="Notifications"
        >
          <Bell className="h-3.5 w-3.5" />
        </Link>

        {/* Profile button */}
        <Link
          to="/profile"
          aria-label="User profile"
          className="flex items-center gap-1.5 rounded-xl border border-primary-200 dark:border-primary-800 px-2 py-1 text-xs font-semibold text-primary-900 dark:text-primary-100 hover:bg-primary-50 dark:hover:bg-primary-900/40 transition shadow-2xs"
          title="Profile & Account"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-300 font-bold text-2xs">
            {user?.name ? user.name[0].toUpperCase() : <User className="h-3.5 w-3.5" />}
          </div>
          <span className="hidden lg:inline max-w-[80px] truncate text-2xs">
            {user?.name || "Farmer"}
          </span>
        </Link>
      </div>
    </header>
  );
}

export default TopNavBar;
