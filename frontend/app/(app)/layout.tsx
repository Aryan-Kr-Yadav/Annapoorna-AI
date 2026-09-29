"use client";

import { useState, useEffect } from "react";
import { Menu, Sprout } from "lucide-react";
import { FarmCropSelector } from "@/components/layout/FarmCropSelector";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { FloatingAssistant } from "@/components/assistant/FloatingAssistant";
import { FarmProvider } from "@/lib/farm-context";
import { LanguageProvider, useTranslation } from "@/lib/i18n";

function TopNavBar({
  onToggleMobile,
  onToggleDesktop,
  isDesktopCollapsed,
}: {
  onToggleMobile: () => void;
  onToggleDesktop: () => void;
  isDesktopCollapsed: boolean;
}) {
  const { language, setLanguage } = useTranslation();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-primary-100 bg-white/95 px-4 sm:px-6 backdrop-blur-md">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={onToggleMobile}
          aria-label="Open navigation menu"
          className="flex md:hidden h-9 w-9 items-center justify-center rounded-xl border border-primary-200 text-primary-700 hover:bg-primary-50 transition"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Desktop Collapse Button */}
        <button
          type="button"
          onClick={onToggleDesktop}
          aria-label={isDesktopCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={isDesktopCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden md:flex h-9 w-9 items-center justify-center rounded-xl border border-primary-200 text-primary-700 hover:bg-primary-50 transition"
        >
          <Menu className="h-4 w-4" />
        </button>

        {/* Mobile App Title */}
        <div className="flex md:hidden items-center gap-1.5 font-bold text-primary-900 text-sm">
          <Sprout className="h-4 w-4 text-primary-600" />
          <span>Annapoorna</span>
        </div>
      </div>

      {/* Global Active Farm + Crop Context Selector */}
      <div className="flex items-center gap-2 sm:gap-3">
        <FarmCropSelector />

        {/* Language quick switcher */}
        <button
          type="button"
          onClick={() => setLanguage(language === "en" ? "hi" : "en")}
          className="rounded-lg border border-primary-200 px-2.5 py-1 text-xs font-semibold text-primary-700 hover:bg-primary-50 transition shadow-2xs"
          title="Switch UI Language"
        >
          {language === "en" ? "हिन्दी" : "EN"}
        </button>
      </div>
    </header>
  );
}

function MainLayoutContainer({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem("annapoorna_sidebar_collapsed") : null;
    if (stored === "true") {
      setCollapsed(true);
    }
  }, []);

  const handleToggleDesktop = () => {
    setCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        window.localStorage.setItem("annapoorna_sidebar_collapsed", String(next));
      }
      return next;
    });
  };

  return (
    <div className="flex min-h-screen bg-[#faf9f6]">
      {/* Desktop Sidebar & Mobile Drawer */}
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={handleToggleDesktop}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        <TopNavBar
          onToggleMobile={() => setMobileOpen(true)}
          onToggleDesktop={handleToggleDesktop}
          isDesktopCollapsed={collapsed}
        />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 md:px-8 pb-20 md:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Quick Bar */}
      <MobileNav onOpenMenu={() => setMobileOpen(true)} />
      <FloatingAssistant />
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <FarmProvider>
      <LanguageProvider>
        <MainLayoutContainer>{children}</MainLayoutContainer>
      </LanguageProvider>
    </FarmProvider>
  );
}
