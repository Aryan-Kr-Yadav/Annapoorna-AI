import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "../../utils/cn";

export function ErrorState({
  title = "Something went wrong",
  message = "Could not load the requested information.",
  onRetry = null,
  className = "",
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-6 sm:p-8 rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50/60 dark:bg-red-950/20 text-red-900 dark:text-red-200",
        className
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300 mb-3">
        <AlertCircle className="h-5 w-5" />
      </div>
      <h3 className="text-sm font-semibold mb-1">{title}</h3>
      <p className="text-xs text-red-700 dark:text-red-300/80 max-w-md mb-4">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-300 dark:border-red-800 bg-white dark:bg-red-950/60 text-xs font-semibold text-red-800 dark:text-red-200 hover:bg-red-50 dark:hover:bg-red-900/40 transition shadow-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
}

export default ErrorState;
