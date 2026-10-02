import React from "react";
import { Sprout } from "lucide-react";
import { cn } from "../../utils/cn";

export function EmptyState({
  icon: Icon = Sprout,
  title = "No records found",
  description = "There are no entries available in this section yet.",
  action = null,
  className = "",
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl border border-dashed border-primary-200 dark:border-primary-900/40 bg-white/50 dark:bg-[#151e13]/50",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 mb-4 shadow-inner">
        <Icon className="h-6 w-6 stroke-[1.75]" />
      </div>
      <h3 className="text-base font-semibold text-primary-950 dark:text-primary-50 mb-1">
        {title}
      </h3>
      <p className="text-sm text-stone-500 dark:text-stone-400 max-w-sm mb-5 leading-relaxed">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}

export default EmptyState;
