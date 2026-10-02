import React from "react";
import { cn } from "../../utils/cn";

const variantStyles = {
  primary: "bg-primary-50 dark:bg-primary-950/60 text-primary-800 dark:text-primary-300 border-primary-200 dark:border-primary-800",
  success: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  warning: "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  danger: "bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800",
  earth: "bg-earth-50 dark:bg-earth-950/60 text-earth-800 dark:text-earth-300 border-earth-200 dark:border-earth-800",
  neutral: "bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700",
};

export function Badge({ children, variant = "neutral", className = "", size = "md" }) {
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-2xs" : "px-2.5 py-1 text-xs";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-semibold rounded-full border shadow-2xs transition",
        variantStyles[variant] || variantStyles.neutral,
        sizeClasses,
        className
      )}
    >
      {children}
    </span>
  );
}

export default Badge;
