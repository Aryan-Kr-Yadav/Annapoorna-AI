"use client";

import { useEffect, useState, useCallback } from "react";
import { useFarms } from "@/lib/farm-context";
import { useApi } from "@/lib/api-client";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import {
  Stethoscope,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Eye,
  ShieldAlert,
  Clock,
  Sparkles,
  Info,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Minus,
  X,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CropCycle, Diagnosis, DiagnosisAnalysisDetails } from "@/lib/types";
import { useTranslation } from "@/lib/i18n";

type SeverityFilter = "all" | "low" | "medium" | "high";

export default function CropDoctorPage() {
  const api = useApi();
  const { t } = useTranslation();
  const { selectedFarm, crops, selectedCrop, selectCrop } = useFarms();

  const [symptoms, setSymptoms] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [history, setHistory] = useState<Diagnosis[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");

  const [newResult, setNewResult] = useState<Diagnosis | null>(null);
  const [viewingDiagnosis, setViewingDiagnosis] = useState<Diagnosis | null>(null);

  const loadHistory = useCallback(
    (cropId: string) => {
      setLoadingHistory(true);
      api
        .get<Diagnosis[]>(`/crops/${cropId}/diagnoses`)
        .then(setHistory)
        .catch(() => setHistory([]))
        .finally(() => setLoadingHistory(false));
    },
    [api]
  );

  useEffect(() => {
    if (selectedCrop) {
      loadHistory(selectedCrop.id);
    } else {
      setHistory([]);
    }
  }, [selectedCrop?.id, loadHistory]);

  function onFile(f: File | null) {
    setImage(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function analyze() {
    if (!selectedCrop || (!image && !symptoms.trim())) return;
    setAnalyzing(true);
    setNewResult(null);
    setErrorMsg(null);

    try {
      const form = new FormData();
      form.append("symptoms_reported", symptoms);
      if (image) form.append("image", image);

      const diagnosis = await api.post<Diagnosis>(
        `/crops/${selectedCrop.id}/diagnoses`,
        form,
        true
      );

      setNewResult(diagnosis);
      setSymptoms("");
      onFile(null);
      loadHistory(selectedCrop.id);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to complete crop diagnosis. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  }

  // Filter history by severity
  const filteredHistory = history.filter((d) => {
    if (severityFilter === "all") return true;
    return d.severity.toLowerCase() === severityFilter;
  });

  // Calculate progression if 2 or more inspections exist
  const hasProgression = history.length >= 2;
  const latestInspection = history[0];
  const previousInspection = history[1];

  let progressionNote = "";
  let progressionType: "improved" | "worsened" | "same" = "same";
  if (hasProgression) {
    const sevRank: Record<string, number> = { low: 1, medium: 2, high: 3, unknown: 0 };
    const latestRank = sevRank[latestInspection.severity] || 0;
    const prevRank = sevRank[previousInspection.severity] || 0;

    if (latestRank < prevRank) {
      progressionType = "improved";
      progressionNote = `Recorded severity is lower than the previous inspection (${previousInspection.severity} → ${latestInspection.severity}).`;
    } else if (latestRank > prevRank) {
      progressionType = "worsened";
      progressionNote = `Recorded severity is higher than the previous inspection (${previousInspection.severity} → ${latestInspection.severity}). Immediate field action recommended.`;
    } else {
      progressionType = "same";
      progressionNote = `Recorded severity remained consistent (${latestInspection.severity}) since previous inspection on ${formatDate(previousInspection.created_at)}.`;
    }
  }

  if (crops.length === 0) {
    return (
      <EmptyState
        icon={Stethoscope}
        title="No active crop on this farm"
        description="To perform health diagnosis and track inspections, plant or activate a crop on this farm."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Title & Context Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-primary-100 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary-950 flex items-center gap-2">
            <Stethoscope className="h-6 w-6 text-rose-600" />
            <span>{t("doctor.title")}</span>
          </h1>
          <p className="text-xs sm:text-sm text-primary-600 mt-1">
            {t("doctor.subtitle")}
          </p>
        </div>

        {/* Selected Crop Switcher */}
        <div className="flex items-center gap-2 rounded-xl bg-white border border-primary-200 px-3 py-1.5 shadow-2xs">
          <span className="text-xs text-primary-500 font-medium">Crop:</span>
          <select
            value={selectedCrop?.id || ""}
            onChange={(e) => selectCrop(e.target.value)}
            className="text-xs sm:text-sm font-bold text-primary-900 bg-transparent outline-none cursor-pointer"
          >
            {crops.map((c) => (
              <option key={c.id} value={c.id}>
                {c.crop_name} ({c.season} {c.year}) — {c.status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          {errorMsg}
        </div>
      )}

      {/* New Inspection Form */}
      <div className="card space-y-4 bg-gradient-to-br from-white via-primary-50/20 to-rose-50/30">
        <div className="flex items-center gap-2 text-primary-950 font-bold text-base">
          <Sparkles className="h-4 w-4 text-rose-500" />
          <span>New Crop Health Inspection</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Symptoms description */}
          <div className="space-y-1.5">
            <label className="label">Observed Symptoms</label>
            <textarea
              className="input text-xs sm:text-sm resize-none"
              rows={4}
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="Describe symptoms: e.g. yellow stripes on lower leaves, brown spots, stunted tillering, pest webbing..."
            />
            <p className="text-[11px] text-primary-400">
              Provide symptoms or upload a photo of the affected plant leaf/stem.
            </p>
          </div>

          {/* Photo upload & preview */}
          <div className="space-y-1.5 flex flex-col justify-between">
            <div>
              <label className="label">{t("doctor.upload_leaf")}</label>
              <div className="relative border-2 border-dashed border-primary-200 rounded-xl p-4 text-center hover:bg-primary-50/50 transition cursor-pointer">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => onFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="flex flex-col items-center">
                  <Upload className="h-6 w-6 text-primary-500 mb-1" />
                  <span className="text-xs font-semibold text-primary-800">
                    {image ? image.name : "Click to select or drop plant photo"}
                  </span>
                  <span className="text-[10px] text-primary-400 mt-0.5">JPG, PNG, or WebP up to 5MB</span>
                </div>
              </div>
            </div>

            {preview && (
              <div className="relative mt-2 flex items-center gap-2">
                <img src={preview} alt="Inspection preview" className="h-16 w-16 object-cover rounded-lg border" />
                <button
                  type="button"
                  onClick={() => onFile(null)}
                  className="text-xs text-red-600 hover:underline font-medium"
                >
                  Remove photo
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={analyze}
            disabled={analyzing || (!image && !symptoms.trim())}
            className="btn-primary inline-flex items-center gap-2 px-5 py-2 text-sm shadow-md"
          >
            {analyzing ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>{t("doctor.analyzing")}</span>
              </>
            ) : (
              <>
                <Stethoscope className="h-4 w-4" />
                <span>{t("doctor.analyze")}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Immediate Result Card (Structured Analysis View) */}
      {newResult && (
        <div className="card space-y-4 border-2 border-rose-200 bg-white shadow-md animate-in fade-in duration-300">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rose-100 pb-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">
                Latest Inspection Result
              </span>
              <h2 className="text-xl font-bold text-primary-950 mt-0.5">
                {newResult.possible_condition || "No specific condition identified"}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  newResult.severity === "high"
                    ? "danger"
                    : newResult.severity === "medium"
                    ? "warning"
                    : "success"
                }
                className="text-xs px-2.5 py-1 uppercase"
              >
                Severity: {newResult.severity}
              </Badge>
              {newResult.confidence_percentage !== null && (
                <span className="text-xs font-semibold text-primary-500">
                  Confidence: {newResult.confidence_percentage}%
                </span>
              )}
            </div>
          </div>

          {/* Structured Analysis Sections */}
          <StructuredAnalysisView diagnosis={newResult} />
        </div>
      )}

      {/* Inspection Progression Timeline (Requirement 15) */}
      {hasProgression && (
        <div className="card space-y-3 bg-gradient-to-br from-white to-primary-50/40">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary-600 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>Crop Health Progression Timeline</span>
            </h3>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                progressionType === "improved"
                  ? "bg-emerald-100 text-emerald-800"
                  : progressionType === "worsened"
                  ? "bg-rose-100 text-rose-800"
                  : "bg-sky-100 text-sky-800"
              )}
            >
              {progressionType === "improved" && <TrendingDown className="h-3.5 w-3.5" />}
              {progressionType === "worsened" && <TrendingUp className="h-3.5 w-3.5" />}
              {progressionType === "same" && <Minus className="h-3.5 w-3.5" />}
              {progressionNote}
            </span>
          </div>

          {/* Timeline steps */}
          <div className="flex items-center gap-2 overflow-x-auto py-2">
            {history
              .slice(0, 5)
              .reverse()
              .map((item, idx, arr) => (
                <div key={item.id} className="flex items-center gap-2 shrink-0">
                  <div className="rounded-xl border border-primary-200 bg-white p-2.5 shadow-2xs text-xs">
                    <p className="font-semibold text-primary-900">{formatDate(item.created_at)}</p>
                    <p className="text-[11px] text-primary-600 truncate max-w-[130px]">
                      {item.possible_condition || "Healthy"}
                    </p>
                    <Badge
                      variant={
                        item.severity === "high"
                          ? "danger"
                          : item.severity === "medium"
                          ? "warning"
                          : "success"
                      }
                      className="mt-1 text-[10px] px-1.5"
                    >
                      {item.severity}
                    </Badge>
                  </div>
                  {idx < arr.length - 1 && <ChevronRight className="h-4 w-4 text-primary-300 shrink-0" />}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Inspection History (Requirement 12) */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-bold text-primary-950">
            {selectedCrop?.crop_name} — Inspection History ({history.length})
          </h2>

          {/* Severity filter pills */}
          <div className="flex items-center gap-1.5 bg-primary-100/60 p-1 rounded-xl">
            {(["all", "low", "medium", "high"] as SeverityFilter[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setSeverityFilter(f)}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-semibold capitalize transition",
                  severityFilter === f
                    ? "bg-white text-primary-900 shadow-2xs"
                    : "text-primary-600 hover:text-primary-900"
                )}
              >
                {f === "medium" ? "Moderate" : f}
              </button>
            ))}
          </div>
        </div>

        {loadingHistory ? (
          <CardSkeleton />
        ) : filteredHistory.length === 0 ? (
          <EmptyState
            title="No inspections found"
            description={
              history.length === 0
                ? "No health inspections have been run for this crop yet."
                : "No inspections match the selected severity filter."
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredHistory.map((d) => (
              <div
                key={d.id}
                className="card flex flex-col justify-between space-y-3 border hover:border-primary-300 transition shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-primary-500">
                      {formatDate(d.created_at)}
                    </span>
                    <Badge
                      variant={
                        d.severity === "high"
                          ? "danger"
                          : d.severity === "medium"
                          ? "warning"
                          : "success"
                      }
                      className="text-[11px]"
                    >
                      {d.severity}
                    </Badge>
                  </div>

                  <h3 className="mt-2 text-sm font-bold text-primary-950 line-clamp-1">
                    {d.possible_condition || "Healthy / No major issue"}
                  </h3>

                  {d.symptoms_reported && (
                    <p className="mt-1 text-xs text-primary-600 line-clamp-2">
                      <span className="font-semibold text-primary-700">Symptoms:</span>{" "}
                      {d.symptoms_reported}
                    </p>
                  )}
                </div>

                <div className="border-t border-primary-100 pt-2 flex items-center justify-between">
                  <span className="text-[11px] text-primary-400">
                    Confidence: {d.confidence_percentage !== null ? `${d.confidence_percentage}%` : "—"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setViewingDiagnosis(d)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary-700 hover:text-primary-950 underline"
                  >
                    <Eye className="h-3.5 w-3.5" /> View Inspection
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Complete Historical Inspection Detail Modal (Requirement 13) */}
      {viewingDiagnosis && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            {/* Modal header */}
            <div className="flex items-start justify-between border-b border-primary-100 pb-3">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-rose-600">
                  Historical Inspection Record
                </span>
                <h3 className="text-xl font-bold text-primary-950 mt-0.5">
                  {viewingDiagnosis.possible_condition || "No specific condition identified"}
                </h3>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-primary-500">
                  <span>{formatDate(viewingDiagnosis.created_at)}</span>
                  <span>•</span>
                  <span>Farm: {selectedFarm?.name}</span>
                  <span>•</span>
                  <span>Crop: {selectedCrop?.crop_name}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewingDiagnosis(null)}
                aria-label="Close"
                className="rounded-lg p-1.5 text-primary-400 hover:bg-primary-50 hover:text-primary-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Inspection details */}
            {viewingDiagnosis.image_url && (
              <div>
                <span className="text-xs font-semibold text-primary-500">Recorded Field Photograph:</span>
                <img
                  src={viewingDiagnosis.image_url}
                  alt="Recorded diagnosis"
                  className="mt-1 max-h-56 w-full rounded-xl border object-cover"
                />
              </div>
            )}

            {viewingDiagnosis.symptoms_reported && (
              <div className="rounded-xl bg-primary-50/70 p-3 text-xs text-primary-800">
                <span className="font-bold">Farmer Reported Symptoms:</span> {viewingDiagnosis.symptoms_reported}
              </div>
            )}

            {/* Structured details display */}
            <StructuredAnalysisView diagnosis={viewingDiagnosis} />

            <div className="border-t border-primary-100 pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingDiagnosis(null)}
                className="btn-secondary text-xs px-4 py-2"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Renders the 9 structured analysis sections (Requirement 14)
 */
function StructuredAnalysisView({ diagnosis }: { diagnosis: Diagnosis }) {
  const details = diagnosis.analysis_details;

  // Fallback if older diagnosis without structured analysis_details
  if (!details) {
    return (
      <div className="space-y-3 text-xs sm:text-sm text-primary-800">
        {diagnosis.recommendation ? (
          <div className="whitespace-pre-wrap rounded-xl bg-primary-50/50 p-4 border border-primary-100">
            {diagnosis.recommendation}
          </div>
        ) : (
          <p className="text-primary-500">No recorded recommendation notes available.</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 text-xs sm:text-sm">
      {/* 1. Summary */}
      <div className="rounded-xl border border-primary-100 bg-primary-50/40 p-3.5 space-y-1">
        <h4 className="font-bold text-primary-950 text-xs uppercase tracking-wider">1. Summary</h4>
        <p className="text-primary-800">
          Condition: <strong>{details.possible_condition || diagnosis.possible_condition}</strong>
        </p>
        <p className="text-primary-800 capitalize">
          Severity: <strong>{details.severity || diagnosis.severity}</strong>
        </p>
        {details.confidence_percentage !== null && (
          <p className="text-primary-700">
            Confidence: <strong>{details.confidence_percentage}%</strong>
          </p>
        )}
      </div>

      {/* 2. What We Observed */}
      {details.observations && details.observations.length > 0 && (
        <div className="space-y-1.5">
          <h4 className="font-bold text-primary-950 text-xs uppercase tracking-wider text-primary-700">
            2. What We Observed
          </h4>
          <ul className="list-disc list-inside space-y-1 text-primary-800 pl-1">
            {details.observations.map((obs, idx) => (
              <li key={idx}>{obs}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 3. Possible Causes */}
      {details.possible_causes && details.possible_causes.length > 0 && (
        <div className="space-y-1.5">
          <h4 className="font-bold text-primary-950 text-xs uppercase tracking-wider text-amber-800">
            3. Possible Causes
          </h4>
          <ul className="list-disc list-inside space-y-1 text-primary-800 pl-1">
            {details.possible_causes.map((cause, idx) => (
              <li key={idx}>{cause}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 4. What You Should Do Now (Immediate Actions) */}
      {details.immediate_actions && details.immediate_actions.length > 0 && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 space-y-2">
          <h4 className="font-bold text-emerald-950 text-xs uppercase tracking-wider">
            4. What You Should Do Now (Immediate Field Actions)
          </h4>
          <ol className="list-decimal list-inside space-y-1.5 text-emerald-900 font-medium pl-1">
            {details.immediate_actions.map((act, idx) => (
              <li key={idx}>{act}</li>
            ))}
          </ol>
        </div>
      )}

      {/* 5. Treatment Options */}
      {details.treatment_options && details.treatment_options.length > 0 && (
        <div className="space-y-1.5">
          <h4 className="font-bold text-primary-950 text-xs uppercase tracking-wider text-primary-700">
            5. Treatment Options (Follow Local Agricultural Guidance)
          </h4>
          <ul className="list-disc list-inside space-y-1 text-primary-800 pl-1">
            {details.treatment_options.map((t, idx) => (
              <li key={idx}>{t}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 6. Prevention */}
      {details.prevention && details.prevention.length > 0 && (
        <div className="space-y-1.5">
          <h4 className="font-bold text-primary-950 text-xs uppercase tracking-wider text-primary-700">
            6. Prevention Measures
          </h4>
          <ul className="list-disc list-inside space-y-1 text-primary-800 pl-1">
            {details.prevention.map((prev, idx) => (
              <li key={idx}>{prev}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 7. Monitoring */}
      {details.monitoring && (
        <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-3 space-y-1">
          <h4 className="font-bold text-sky-950 text-xs uppercase tracking-wider">7. Monitoring Advice</h4>
          <p className="text-sky-900">{details.monitoring}</p>
        </div>
      )}

      {/* 8. When to Seek Expert Help */}
      {details.when_to_seek_expert_help && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 space-y-1">
          <h4 className="font-bold text-amber-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            <span>8. When to Seek Expert Help</span>
          </h4>
          <p className="text-amber-900">{details.when_to_seek_expert_help}</p>
        </div>
      )}

      {/* 9. Disclaimer */}
      <div className="text-[11px] text-primary-400 border-t border-primary-100 pt-2 italic">
        {details.disclaimer || "Disclaimer: Image-based AI diagnosis is for decision support only and does not substitute for on-field laboratory diagnosis."}
      </div>
    </div>
  );
}
