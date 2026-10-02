import React from "react";
import { clampScore, getScoreLabel, getScoreStyles } from "../../utils/scoring";

/**
 * ScoreDisplay Component
 *
 * Renders a standardized score out of 100 with its qualitative classification label.
 * Guarantees safe numeric display: never renders "NaN / 100" or qualitative strings as numbers.
 *
 * Modes:
 *   - Stacked (default):
 *       82 / 100
 *       Good
 *   - Compact:
 *       82/100 • Good
 *   - Label-only fallback (if numeric score is not available):
 *       Good
 */
export function ScoreDisplay({
  score,
  label: customLabel,
  title,
  subtext,
  compact = false,
  size = "md",
  showBar = false,
  className = "",
}) {
  const numericScore = clampScore(score);
  const qualitativeLabel = customLabel || (numericScore !== null ? getScoreLabel(numericScore) : "");
  const styles = getScoreStyles(numericScore);

  // Compact version: "82/100 • Good" or "Good"
  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 font-medium text-xs ${className}`}>
        {numericScore !== null ? (
          <>
            <span className="font-extrabold text-stone-900 dark:text-stone-100">
              {numericScore}
              <span className="text-stone-400 dark:text-stone-500 font-normal">/100</span>
            </span>
            {qualitativeLabel && (
              <>
                <span className="text-stone-300 dark:text-stone-600">•</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-2xs font-semibold ${styles.badgeBg} ${styles.badgeText}`}
                >
                  {qualitativeLabel}
                </span>
              </>
            )}
          </>
        ) : (
          qualitativeLabel && (
            <span
              className={`px-2 py-0.5 rounded text-xs font-semibold ${styles.badgeBg} ${styles.badgeText}`}
            >
              {qualitativeLabel}
            </span>
          )
        )}
      </div>
    );
  }

  // Full / Prominent Display
  return (
    <div className={`space-y-1.5 ${className}`}>
      {title && (
        <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block">
          {title}
        </span>
      )}

      <div className="flex items-baseline gap-2.5">
        {numericScore !== null ? (
          <>
            <span
              className={`font-black tracking-tight ${
                size === "lg" ? "text-4xl" : size === "sm" ? "text-xl" : "text-3xl"
              }`}
            >
              {numericScore}
            </span>
            <span className="text-stone-400 dark:text-stone-400 font-semibold text-sm">
              / 100
            </span>
            {qualitativeLabel && (
              <span
                className={`ml-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${styles.badgeBg} ${styles.badgeText} ${styles.border}`}
              >
                {qualitativeLabel}
              </span>
            )}
          </>
        ) : (
          qualitativeLabel && (
            <span
              className={`px-3 py-1 rounded-full text-sm font-bold border ${styles.badgeBg} ${styles.badgeText} ${styles.border}`}
            >
              {qualitativeLabel}
            </span>
          )
        )}
      </div>

      {showBar && numericScore !== null && (
        <div
          role="meter"
          aria-valuenow={numericScore}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={title || "Score"}
          className="w-full bg-stone-100 dark:bg-stone-800 rounded-full h-2 overflow-hidden mt-2"
        >
          <div
            className={`h-full rounded-full transition-all duration-500 ${styles.accent.replace("text-", "bg-")}`}
            style={{ width: `${numericScore}%` }}
          />
        </div>
      )}

      {subtext && (
        <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed pt-0.5">
          {subtext}
        </p>
      )}
    </div>
  );
}

export default ScoreDisplay;
