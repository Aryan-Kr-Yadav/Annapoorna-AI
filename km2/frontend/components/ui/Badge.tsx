import { cn } from "@/lib/utils";

const VARIANTS: Record<string, string> = {
  default: "bg-primary-100 text-primary-800",
  warning: "bg-amber-100 text-amber-800",
  danger: "bg-red-100 text-red-700",
  info: "bg-sky-100 text-sky-700",
  success: "bg-primary-100 text-primary-700",
};

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: keyof typeof VARIANTS;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", VARIANTS[variant], className)}>
      {children}
    </span>
  );
}
