import React from "react";
import { cn } from "../../utils/cn";

export function MetricCard({
  icon: Icon,
  label,
  value,
  subtext = null,
  trend = null, // { value: "+12%", positive: true }
  variant = "neutral",
  onClick = null,
  className = "",
}) {
  const iconVariants = {
    primary: "bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300",
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
    blue: "bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300",
    earth: "bg-earth-50 text-earth-700 dark:bg-earth-950/60 dark:text-earth-300",
    neutral: "bg-stone-100 text-stone-700 dark:bg-[#1a291e] dark:text-stone-300",
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "card flex items-start gap-3.5 transition group",
        onClick && "cursor-pointer hover:border-primary-300 dark:hover:border-primary-700",
        className
      )}
    >
      {Icon && (
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition",
            iconVariants[variant] || iconVariants.neutral
          )}
        >
          <Icon className="h-5 w-5 stroke-[1.8]" />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="text-2xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
          {label}
        </p>
        <div className="flex items-baseline gap-2 mt-0.5">
          <p className="text-lg sm:text-xl font-bold text-[var(--foreground)] truncate tracking-tight">
            {value}
          </p>
          {trend && (
            <span
              className={cn(
                "text-2xs font-bold",
                trend.positive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
              )}
            >
              {trend.value}
            </span>
          )}
        </div>
        {subtext && (
          <p className="text-2xs text-[var(--foreground-muted)] mt-1 line-clamp-1">{subtext}</p>
        )}
      </div>
    </div>
  );
}

export default MetricCard;
