import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Sprout, ArrowRight, Menu, X, Sun, Moon, Globe, LogIn } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useTranslation } from "../../contexts/LanguageContext";

export function PublicNavbar() {
  const { user } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { language, setLanguage, t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "hi" : "en");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-700 text-white shadow-xs dark:bg-primary-600">
            <Sprout className="h-5 w-5" />
          </div>
          <div>
            <span className="text-base font-extrabold tracking-tight text-[var(--foreground)]">
              Annapoorna AI
            </span>
            <span className="hidden sm:inline-block ml-2 text-2xs font-semibold px-2 py-0.5 rounded-full bg-primary-100 text-primary-900 border border-primary-200 dark:bg-primary-950/60 dark:text-primary-300 dark:border-primary-900/60">
              Farm Intelligence
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-[var(--foreground-muted)]">
          <a href="#features" className="hover:text-[var(--foreground)] transition-colors">
            {t("landing.nav_features", "Features")}
          </a>
          <a href="#lifecycle" className="hover:text-[var(--foreground)] transition-colors">
            {t("landing.nav_lifecycle", "Farm Lifecycle")}
          </a>
          <a href="#why-annapoorna" className="hover:text-[var(--foreground)] transition-colors">
            {t("landing.nav_why", "Why Annapoorna")}
          </a>
          <a href="#architecture" className="hover:text-[var(--foreground)] transition-colors">
            {t("landing.nav_how", "How It Works")}
          </a>
        </nav>

        {/* Right Actions */}
        <div className="hidden md:flex items-center gap-3">
          {/* Language Switch */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="flex h-8.5 items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--surface-secondary)] transition shadow-2xs"
            title="Switch Language"
          >
            <Globe className="h-3.5 w-3.5 text-stone-400" />
            <span>{language === "en" ? "हिन्दी" : "English"}</span>
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-8.5 w-8.5 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-secondary)] transition shadow-2xs"
            title="Toggle theme"
          >
            {resolvedTheme === "dark" ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-stone-600" />
            )}
          </button>

          {/* Auth Action */}
          {user ? (
            <Link to="/dashboard" className="btn-primary text-xs py-2 px-3.5">
              <span>{t("landing.go_dashboard", "Go to Dashboard")}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="btn-secondary text-xs py-2 px-3.5"
              >
                <LogIn className="h-3.5 w-3.5 text-stone-500" />
                <span>{t("landing.login", "Log In")}</span>
              </Link>
              <Link
                to="/signup"
                className="btn-primary text-xs py-2 px-3.5"
              >
                <span>{t("landing.get_started", "Get Started")}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)]"
            title="Toggle Theme"
          >
            {resolvedTheme === "dark" ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5 text-stone-600" />}
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)]"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[var(--border)] bg-[var(--surface)] px-4 pt-3 pb-6 space-y-4 animate-in slide-in-from-top-2 duration-150">
          <nav className="flex flex-col space-y-2.5 text-xs font-semibold text-[var(--foreground-muted)]">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-[var(--foreground)]"
            >
              {t("landing.nav_features", "Features")}
            </a>
            <a
              href="#lifecycle"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-[var(--foreground)]"
            >
              {t("landing.nav_lifecycle", "Farm Lifecycle")}
            </a>
            <a
              href="#why-annapoorna"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-[var(--foreground)]"
            >
              {t("landing.nav_why", "Why Annapoorna")}
            </a>
            <a
              href="#architecture"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-[var(--foreground)]"
            >
              {t("landing.nav_how", "How It Works")}
            </a>
          </nav>

          <div className="pt-2 border-t border-[var(--border)] flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                toggleLanguage();
                setMobileMenuOpen(false);
              }}
              className="flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] py-2 text-xs font-medium text-[var(--foreground)]"
            >
              <Globe className="h-3.5 w-3.5 text-stone-400" />
              <span>{t("landing.nav_switch_lang", language === "en" ? "हिन्दी में बदलें" : "Switch to English")}</span>
            </button>

            {user ? (
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-primary w-full text-center text-xs py-2.5"
              >
                {t("landing.go_dashboard", "Go to Dashboard")}
              </Link>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-secondary w-full text-center text-xs py-2.5"
                >
                  {t("landing.login", "Log In")}
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-primary w-full text-center text-xs py-2.5"
                >
                  {t("landing.get_started", "Get Started")}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default PublicNavbar;
