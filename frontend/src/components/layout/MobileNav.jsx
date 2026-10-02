import React from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, Tractor, Stethoscope, Bot, Menu } from "lucide-react";
import { useTranslation } from "../../contexts/LanguageContext";
import { cn } from "../../utils/cn";

export function MobileNav({ onOpenMenu }) {
  const { t } = useTranslation();

  const items = [
    { to: "/dashboard", icon: LayoutDashboard, label: t("nav.dashboard", "Dashboard") },
    { to: "/farms", icon: Tractor, label: t("nav.farms", "Farms") },
    { to: "/crop-doctor", icon: Stethoscope, label: t("nav.crop_doctor", "Doctor") },
    { to: "/assistant", icon: Bot, label: t("nav.assistant", "AI") },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 flex md:hidden h-15 items-center justify-around border-t border-primary-100 dark:border-primary-900/40 bg-white/95 dark:bg-[#121911]/95 px-2 backdrop-blur-md">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-xl text-3xs font-bold transition",
                isActive
                  ? "text-primary-700 dark:text-primary-400"
                  : "text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
              )
            }
          >
            <Icon className="h-4.5 w-4.5 stroke-[1.9]" />
            <span className="truncate max-w-[55px]">{item.label}</span>
          </NavLink>
        );
      })}

      <button
        type="button"
        onClick={onOpenMenu}
        className="flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-xl text-3xs font-bold text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
      >
        <Menu className="h-4.5 w-4.5 stroke-[1.9]" />
        <span>Menu</span>
      </button>
    </nav>
  );
}

export default MobileNav;
