import React from "react";
import { cn } from "../../utils/cn";

export function PageHeader({
  title,
  subtitle = null,
  contextBadge = null,
  actions = null,
  className = "",
}) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-4 border-b border-primary-100 dark:border-primary-900/40 pb-5", className)}>
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-primary-950 dark:text-primary-50">
            {title}
          </h1>
          {contextBadge}
        </div>
        {subtitle && (
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function SectionHeader({ title, subtitle = null, action = null, className = "" }) {
  return (
    <div className={cn("flex items-center justify-between gap-2 mb-3.5", className)}>
      <div>
        <h2 className="text-sm font-bold text-primary-950 dark:text-primary-100 tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-2xs text-stone-500 dark:text-stone-400 mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export default PageHeader;
