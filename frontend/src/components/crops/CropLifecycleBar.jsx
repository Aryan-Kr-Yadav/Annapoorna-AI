import React from "react";
import { Check, Calendar } from "lucide-react";
import { cn } from "../../utils/cn";

export function CropLifecycleBar({ lifecycle, cropName = "Crop", season = "" }) {
  if (!lifecycle || !lifecycle.stages || lifecycle.stages.length === 0) {
    return (
      <div className="card p-4">
        <p className="text-xs text-stone-500">Lifecycle model is being calculated...</p>
      </div>
    );
  }

  const { day_number, current_stage, stages, progress_percentage } = lifecycle;

  return (
    <div className="card space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-primary-100 dark:border-primary-900/40 pb-3">
        <div>
          <span className="text-2xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
            Lifecycle Progress • Day {day_number || 1}
          </span>
          <h3 className="text-base sm:text-lg font-bold text-primary-950 dark:text-primary-50">
            {current_stage || "Active Growth"}
          </h3>
        </div>

        {progress_percentage !== null && progress_percentage !== undefined && (
          <div className="flex items-center gap-1.5 bg-primary-50 dark:bg-primary-950/60 border border-primary-200 dark:border-primary-800 rounded-xl px-2.5 py-1 text-xs font-bold text-primary-800 dark:text-primary-300">
            <span>{Math.round(progress_percentage)}%</span>
            <span className="text-3xs font-normal text-stone-400">to harvest</span>
          </div>
        )}
      </div>

      {/* Progress Track */}
      <div className="relative pt-2 pb-1">
        <div className="h-2 w-full overflow-hidden rounded-full bg-primary-100 dark:bg-primary-950">
          <div
            className="h-full rounded-full bg-primary-600 dark:bg-primary-500 transition-all duration-500"
            style={{ width: `${Math.min(Math.max(progress_percentage || 0, 4), 100)}%` }}
          />
        </div>

        {/* Milestone Steps */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 mt-4">
          {stages.map((st, idx) => {
            const isCurrent = st.name === current_stage;
            const isCompleted = day_number >= st.end_day;

            return (
              <div
                key={st.name || idx}
                className={cn(
                  "p-2.5 rounded-xl border text-center transition",
                  isCurrent
                    ? "bg-primary-600 text-white border-primary-700 shadow-sm"
                    : isCompleted
                    ? "bg-primary-50 dark:bg-primary-950/40 border-primary-200 dark:border-primary-800 text-primary-900 dark:text-primary-200"
                    : "bg-white/60 dark:bg-[#151e13]/60 border-primary-100 dark:border-primary-900/30 text-stone-400 dark:text-stone-500"
                )}
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  <div
                    className={cn(
                      "flex h-4 w-4 items-center justify-center rounded-full text-3xs font-bold",
                      isCurrent
                        ? "bg-white text-primary-700"
                        : isCompleted
                        ? "bg-primary-600 text-white"
                        : "bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400"
                    )}
                  >
                    {isCompleted ? <Check className="h-2.5 w-2.5" /> : idx + 1}
                  </div>
                </div>
                <p className="text-xs font-bold truncate">{st.name}</p>
                <p
                  className={cn(
                    "text-3xs mt-0.5",
                    isCurrent ? "text-primary-100" : "text-stone-400 dark:text-stone-500"
                  )}
                >
                  Day {st.start_day}–{st.end_day}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default CropLifecycleBar;
