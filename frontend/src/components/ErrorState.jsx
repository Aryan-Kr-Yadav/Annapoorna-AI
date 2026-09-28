import { AlertTriangle, RefreshCw } from "lucide-react";

export default function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-red-100 bg-red-50 px-6 py-12 text-center dark:border-red-900/40 dark:bg-red-950/20">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400">
        <AlertTriangle size={26} />
      </div>
      <h3 className="font-display text-lg font-semibold text-red-700 dark:text-red-300">
        Something went wrong
      </h3>
      <p className="max-w-sm text-sm text-red-500 dark:text-red-400">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-primary !bg-red-600 hover:!bg-red-700">
          <RefreshCw size={16} /> Try Again
        </button>
      )}
    </div>
  );
}
