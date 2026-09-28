import { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-primary-200 bg-primary-50/40 px-6 py-12 text-center">
      {Icon && <Icon className="mb-3 h-8 w-8 text-primary-400" strokeWidth={1.5} />}
      <p className="text-sm font-medium text-primary-900">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-primary-600">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
