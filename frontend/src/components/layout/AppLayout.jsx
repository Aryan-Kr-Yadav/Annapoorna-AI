import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopNavBar } from "./TopNavBar";
import { MobileNav } from "./MobileNav";
import { FloatingAssistant } from "../assistant/FloatingAssistant";
import { FarmProvider } from "../../contexts/FarmContext";

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("annapoorna_sidebar_collapsed");
    if (stored === "true") {
      setCollapsed(true);
    }
  }, []);

  const handleToggleDesktop = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("annapoorna_sidebar_collapsed", String(next));
      return next;
    });
  };

  return (
    <FarmProvider>
      <div className="flex min-h-screen flex-col bg-[rgb(var(--background))] text-[rgb(var(--foreground))]">
        {/* Top Navigation Bar spanning full width */}
        <TopNavBar
          onToggleMobile={() => setMobileOpen(true)}
          onToggleDesktop={handleToggleDesktop}
          isDesktopCollapsed={collapsed}
        />

        <div className="flex flex-1 min-h-0">
          {/* Desktop Sidebar & Mobile Drawer */}
          <Sidebar
            collapsed={collapsed}
            onToggleCollapse={handleToggleDesktop}
            mobileOpen={mobileOpen}
            onCloseMobile={() => setMobileOpen(false)}
          />

          {/* Main Content Area */}
          <main className="flex-1 min-w-0 px-3 sm:px-6 md:px-8 py-5 pb-20 md:pb-8">
            <div className="mx-auto w-full max-w-6xl">
              <Outlet />
            </div>
          </main>
        </div>

        {/* Mobile Bottom Quick Bar */}
        <MobileNav onOpenMenu={() => setMobileOpen(true)} />
        <FloatingAssistant />
      </div>
    </FarmProvider>
  );
}

export default AppLayout;
