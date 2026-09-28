"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";

export function Tabs({
  tabs,
  defaultTab,
}: {
  tabs: { id: string; label: string; content: React.ReactNode }[];
  defaultTab?: string;
}) {
  const [active, setActive] = useState(defaultTab || tabs[0]?.id);
  const activeTab = tabs.find((t) => t.id === active);

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto border-b border-primary-100 pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={cn(
              "whitespace-nowrap rounded-t-lg px-4 py-2 text-sm font-medium transition",
              active === tab.id
                ? "border-b-2 border-primary-600 text-primary-800"
                : "text-primary-500 hover:text-primary-700"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="pt-4">{activeTab?.content}</div>
    </div>
  );
}
