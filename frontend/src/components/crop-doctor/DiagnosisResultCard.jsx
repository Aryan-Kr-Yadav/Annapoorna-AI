import React from "react";
import {
  Stethoscope,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ShieldAlert,
  Info,
  Calendar,
  Eye,
  Activity,
  ArrowRight,
} from "lucide-react";
import { Badge } from "../common/Badge";
import { formatDate } from "../../utils/formatters";
import { cn } from "../../utils/cn";

export function DiagnosisResultCard({ diagnosis, onInspectAnother = null }) {
  if (!diagnosis) return null;

  const {
    possible_condition,
    severity,
    recommendation,
    analysis_details,
    image_url,
    symptoms_reported,
    created_at,
  } = diagnosis;

  const severityVariant =
    severity === "high"
      ? "danger"
      : severity === "medium"
      ? "warning"
      : severity === "low"
      ? "success"
      : "neutral";

  const details = analysis_details || {};

  return (
    <div className="card space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-primary-100 dark:border-primary-900/40 pb-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
            <Stethoscope className="h-6 w-6 stroke-[1.8]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                AI Agronomic Inspection
              </span>
              <Badge variant={severityVariant}>
                Severity: {severity ? severity.toUpperCase() : "UNKNOWN"}
              </Badge>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-primary-950 dark:text-primary-50 mt-0.5">
              {possible_condition || "Condition Identified"}
            </h2>
            {created_at && (
              <p className="text-2xs text-stone-400 mt-0.5">Inspected on {formatDate(created_at)}</p>
            )}
          </div>
        </div>

        {onInspectAnother && (
          <button type="button" onClick={onInspectAnother} className="btn-secondary text-xs">
            Inspect Another
          </button>
        )}
      </div>

      {/* Reported Symptoms & Photo Evidence */}
      <div className="grid sm:grid-cols-3 gap-4">
        {image_url && (
          <div className="sm:col-span-1 rounded-xl overflow-hidden border border-primary-100 dark:border-primary-900/40 bg-stone-100 dark:bg-stone-900 max-h-48">
            <img src={image_url} alt="Inspected leaf sample" className="w-full h-full object-cover" />
          </div>
        )}

        <div className={cn("space-y-3", image_url ? "sm:col-span-2" : "sm:col-span-3")}>
          {symptoms_reported && (
            <div className="p-3 rounded-xl bg-stone-50 dark:bg-[#1a2517] border border-primary-100 dark:border-primary-900/40">
              <span className="text-3xs font-bold uppercase tracking-wider text-stone-400 block mb-1">
                Reported Visual Symptoms
              </span>
              <p className="text-xs text-stone-700 dark:text-stone-300 italic">
                "{symptoms_reported}"
              </p>
            </div>
          )}

          {details.observations && details.observations.length > 0 && (
            <div>
              <span className="text-2xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block mb-1.5">
                Visual Observations Extracted
              </span>
              <ul className="space-y-1 text-xs text-stone-700 dark:text-stone-300">
                {details.observations.map((obs, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                    <span>{obs}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Possible Causes */}
      {details.possible_causes && details.possible_causes.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40">
          <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300 mb-2 flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span>Probable Root Causes</span>
          </h4>
          <ul className="grid sm:grid-cols-2 gap-2 text-xs text-amber-900/90 dark:text-amber-200/90">
            {details.possible_causes.map((c, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-amber-600 dark:text-amber-400 font-bold">•</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Immediate Actions Today */}
      {details.immediate_actions && details.immediate_actions.length > 0 && (
        <div className="p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50">
          <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-200 mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>What to Do Today (Immediate Action)</span>
          </h4>
          <ul className="space-y-1.5 text-xs text-emerald-900 dark:text-emerald-200/90">
            {details.immediate_actions.map((act, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-200 dark:bg-emerald-800 text-3xs font-bold text-emerald-900 dark:text-white shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span>{act}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Treatment & Cultural Solutions */}
      {details.treatment_options && details.treatment_options.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-primary-950 dark:text-primary-100 uppercase tracking-wider">
            Treatment & Management Options
          </h4>
          <div className="grid sm:grid-cols-2 gap-2.5">
            {details.treatment_options.map((tr, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl border border-primary-100 dark:border-primary-900/40 bg-white dark:bg-[#162014] text-xs text-stone-700 dark:text-stone-300"
              >
                {tr}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prevention & Monitoring Grid */}
      <div className="grid sm:grid-cols-2 gap-4 text-xs">
        {details.prevention && details.prevention.length > 0 && (
          <div className="card p-4 space-y-1.5">
            <span className="text-2xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
              Future Prevention
            </span>
            <ul className="space-y-1 text-stone-700 dark:text-stone-300">
              {details.prevention.map((p, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-primary-500">•</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="card p-4 space-y-3">
          {details.monitoring && (
            <div>
              <span className="text-2xs font-bold uppercase tracking-wider text-stone-400 block mb-1">
                Monitoring Plan
              </span>
              <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
                {details.monitoring}
              </p>
            </div>
          )}

          {details.when_to_seek_expert_help && (
            <div className="pt-2 border-t border-primary-50 dark:border-primary-950">
              <span className="text-2xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 block mb-1">
                When to Seek KVK / Agronomist Help
              </span>
              <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
                {details.when_to_seek_expert_help}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Unstructured Fallback recommendation if no structured fields */}
      {!analysis_details && recommendation && (
        <div className="p-4 rounded-xl bg-stone-50 dark:bg-[#1a2517] border border-primary-100 dark:border-primary-900/40 text-xs text-stone-700 dark:text-stone-300 whitespace-pre-wrap leading-relaxed">
          {recommendation}
        </div>
      )}

      {/* Scientific Advisory Disclaimer */}
      <div className="text-3xs text-stone-400 dark:text-stone-500 pt-2 border-t border-primary-50 dark:border-primary-950 italic">
        {details.disclaimer ||
          "This automated visual analysis is for decision support only and does not substitute for laboratory on-field diagnosis."}
      </div>
    </div>
  );
}

export default DiagnosisResultCard;
