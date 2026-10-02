import React from "react";
import { clampScore, getScoreLabel, getScoreStyles } from "../../utils/scoring";

/**
 * ScoreBadge Component
 *
 * Compact chip for cards, tables, and lists.
 * Shows numeric score and qualitative status.
 */
export function ScoreBadge({ score, label, className = "" }) {
  const numericScore = clampScore(score);
  const qualitativeLabel = label || (numericScore !== null ? getScoreLabel(numericScore) : "");
  const styles = getScoreStyles(numericScore);

  if (numericScore === null && !qualitativeLabel) return null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${styles.badgeBg} ${styles.badgeText} ${styles.border} ${className}`}
    >
      {numericScore !== null && (
        <span className="font-extrabold">{numericScore}/100</span>
      )}
      {numericScore !== null && qualitativeLabel && (
        <span className="opacity-60">•</span>
      )}
      {qualitativeLabel && <span>{qualitativeLabel}</span>}
    </span>
  );
}

export default ScoreBadge;
