import React from "react";
import { cn } from "../../utils/cn";

export function Tabs({ tabs = [], activeTab = "", onChange = () => {}, className = "" }) {
  return (
    <div
      role="tablist"
      className={cn(
        "flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-primary-100 dark:border-primary-900/40 pb-2",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-semibold transition cursor-pointer select-none",
              isActive
                ? "bg-primary-600 text-white shadow-xs dark:bg-primary-500"
                : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-primary-50 dark:hover:bg-primary-900/40"
            )}
          >
            {Icon && <Icon className="h-4 w-4 shrink-0" />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.2 text-2xs font-bold",
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-300"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
