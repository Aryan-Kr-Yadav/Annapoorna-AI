"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Tractor, MessageCircle, Stethoscope, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

const PRIMARY = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/farms", label: "Farms", icon: Tractor },
  { href: "/crop-doctor", label: "Doctor", icon: Stethoscope },
  { href: "/assistant", label: "Assistant", icon: MessageCircle },
];

export function MobileNav({ onOpenMenu }: { onOpenMenu?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-primary-100 dark:border-primary-900/40 bg-white/95 dark:bg-[#121911]/95 backdrop-blur-sm md:hidden shadow-lg">
      {PRIMARY.map((item) => {
        const active = pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition",
              active
                ? "text-primary-700 dark:text-primary-300 font-bold"
                : "text-primary-400 hover:text-primary-600 dark:hover:text-primary-300"
            )}
          >
            <item.icon className="h-5 w-5" strokeWidth={active ? 2.25 : 1.75} />
            {item.label}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="More navigation options"
        className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition"
      >
        <Menu className="h-5 w-5" strokeWidth={1.75} />
        Menu
      </button>
    </nav>
  );
}
