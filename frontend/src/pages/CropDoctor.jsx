import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  ShieldAlert,
  Upload,
  Camera,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  X,
  Sparkles,
  Info,
  Clock,
  Eye,
  Trash2,
  RefreshCw,
  Sprout,
  Tractor,
} from "lucide-react";
import { useFarms } from "../contexts/FarmContext";
import { useTranslation } from "../contexts/LanguageContext";
import cropsApi from "../api/crops";
import PageHeader from "../components/common/PageHeader";
import Badge from "../components/common/Badge";
import EmptyState from "../components/common/EmptyState";
import ErrorState from "../components/common/ErrorState";
import Skeleton from "../components/common/Skeleton";
import DiagnosisResultCard from "../components/crop-doctor/DiagnosisResultCard";
import { formatDate, formatDateTime } from "../utils/formatters";

export default function CropDoctor() {
  const { t } = useTranslation();
  const { farms, selectedFarm, selectFarm, crops, selectedCrop, selectCrop } = useFarms();

  const [symptoms, setSymptoms] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [severityFilter, setSeverityFilter] = useState("all");

  const [newResult, setNewResult] = useState(null);
  const [viewingDiagnosis, setViewingDiagnosis] = useState(null);

  const fileInputRef = useRef(null);

  const loadHistory = useCallback(async (cropId) => {
    if (!cropId) {
      setHistory([]);
      return;
    }
    setLoadingHistory(true);
    try {
      const data = await cropsApi.getDiagnoses(cropId);
      setHistory(Array.isArray(data) ? data : []);
    } catch {
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCrop?.id) {
      loadHistory(selectedCrop.id);
    } else {
      setHistory([]);
    }
  }, [selectedCrop?.id, loadHistory]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setErrorMsg(null);
    }
  };

  const handleClearImage = () => {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!selectedCrop?.id) {
      setErrorMsg("Please select an active farm and crop cycle before analyzing.");
      return;
    }
    if (!imageFile && !symptoms.trim()) {
      setErrorMsg("Please either upload a crop photo or describe observed symptoms.");
      return;
    }

    setAnalyzing(true);
    setErrorMsg(null);
    setNewResult(null);

    try {
      const formData = new FormData();
      formData.append("symptoms_reported", symptoms);
      if (imageFile) {
        formData.append("image", imageFile);
      }

      const result = await cropsApi.createDiagnosis(selectedCrop.id, formData);
      setNewResult(result);
      setSymptoms("");
      handleClearImage();
      loadHistory(selectedCrop.id);
    } catch (err) {
      setErrorMsg(err?.message || "Failed to analyze crop pathology. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const filteredHistory = history.filter((d) => {
    if (severityFilter === "all") return true;
    return (d.severity || "low").toLowerCase() === severityFilter;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("cropDoctor.title", "Crop Doctor")}
        subtitle="Visual pest & pathology diagnostic pipeline powered by high-resolution multimodal vision."
      />

      {/* Farm & Crop Context Selector Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary-200 bg-primary-50/50 p-4 dark:border-primary-900/40 dark:bg-primary-950/20">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary-800 dark:text-primary-300">
            <Tractor className="h-4 w-4" />
            <span>Farm:</span>
            <select
              value={selectedFarm?.id || ""}
              onChange={(e) => selectFarm(e.target.value)}
              className="rounded-lg border border-primary-300 bg-white px-2 py-1 text-xs font-medium text-slate-800 focus:outline-none dark:border-primary-800 dark:bg-[#121c15] dark:text-stone-100"
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            <Sprout className="h-4 w-4" />
            <span>Crop:</span>
            <select
              value={selectedCrop?.id || ""}
              onChange={(e) => selectCrop(e.target.value)}
              className="rounded-lg border border-emerald-300 bg-white px-2 py-1 text-xs font-medium text-slate-800 focus:outline-none dark:border-emerald-800 dark:bg-[#121c15] dark:text-stone-100"
            >
              {crops.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.crop_name} ({c.season} {c.year})
                </option>
              ))}
            </select>
          </div>
        </div>

        <span className="text-xs text-slate-500 dark:text-slate-400">
          Targeted agronomic advice tailored to this crop
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Side: Upload & Diagnostic Form */}
        <div className="space-y-6 lg:col-span-5">
          <form onSubmit={handleAnalyze} className="card space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
              <ShieldAlert className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Run New Diagnosis</h2>
            </div>

            {errorMsg && (
              <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-400">
                {errorMsg}
              </div>
            )}

            {/* Photo Upload Box */}
            <div>
              <label className="label">Crop Photo (Leaf, Stem, or Fruit)</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="crop-photo-input"
              />

              {!imagePreview ? (
                <label
                  htmlFor="crop-photo-input"
                  className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 p-6 text-center transition hover:border-primary-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-primary-400 dark:hover:bg-slate-800/50 cursor-pointer"
                >
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300">
                    <Upload className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Click to upload or drag photo
                  </span>
                  <span className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                    JPG, PNG or WebP up to 10MB
                  </span>
                </label>
              ) : (
                <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                  <img src={imagePreview} alt="Preview" className="h-48 w-full object-cover" />
                  <button
                    type="button"
                    onClick={handleClearImage}
                    className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white transition hover:bg-black"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Symptoms Description */}
            <div>
              <label className="label">Observed Symptoms / Context</label>
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="e.g. Yellowing leaf margins, curled shoots, powdery white substance under leaf..."
                rows={3}
                className="input resize-none text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={analyzing || (!imageFile && !symptoms.trim()) || !selectedCrop}
              className="btn-primary w-full"
            >
              {analyzing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing with Vision AI...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Diagnose Crop Condition
                </>
              )}
            </button>
          </form>

          {/* Diagnostic Result Card if newly analyzed */}
          {newResult && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Analysis Result</h3>
              <DiagnosisResultCard diagnosis={newResult} />
            </div>
          )}
        </div>

        {/* Right Side: Inspection History */}
        <div className="space-y-4 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Past Inspection History</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Stored diagnosis records for {selectedCrop?.crop_name || "selected crop"}.
              </p>
            </div>

            {/* Severity Filter */}
            <div className="flex rounded-lg border border-slate-200 p-0.5 text-xs dark:border-slate-800">
              {["all", "low", "medium", "high"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSeverityFilter(filter)}
                  className={`rounded-md px-2.5 py-1 font-medium capitalize transition ${
                    severityFilter === filter
                      ? "bg-primary-600 text-white"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {loadingHistory ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : filteredHistory.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="No inspections found"
              description="No stored diagnosis records match this filter for the selected crop."
            />
          ) : (
            <div className="space-y-3">
              {filteredHistory.map((item) => (
                <div
                  key={item.id}
                  className="card flex flex-col justify-between gap-4 transition hover:border-primary-300 dark:hover:border-primary-800 sm:flex-row sm:items-center"
                >
                  <div className="flex items-start gap-3">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt="Crop pathology"
                        className="h-16 w-16 shrink-0 rounded-lg object-cover border border-slate-200 dark:border-slate-800"
                      />
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400 dark:bg-slate-800">
                        <ShieldAlert className="h-6 w-6" />
                      </div>
                    )}
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {item.disease_name || item.condition || "Health Inspection"}
                        </h4>
                        <Badge
                          variant={
                            item.severity === "high"
                              ? "error"
                              : item.severity === "medium"
                              ? "warning"
                              : "success"
                          }
                          className="capitalize text-[10px]"
                        >
                          {item.severity || "healthy"}
                        </Badge>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Inspected on {formatDate(item.created_at)}
                      </p>

                      {item.symptoms_reported && (
                        <p className="text-xs text-slate-600 line-clamp-1 dark:text-slate-300">
                          Symptoms: {item.symptoms_reported}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setViewingDiagnosis(item)}
                    className="btn-secondary self-start sm:self-center text-xs shrink-0"
                  >
                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                    View Analysis
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stored Diagnosis Details Modal */}
      {viewingDiagnosis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-[#142219] border border-primary-100 dark:border-[#1e3627]">
            <DiagnosisResultCard diagnosis={viewingDiagnosis} />
            <div className="mt-4 flex justify-end">
              <button onClick={() => setViewingDiagnosis(null)} className="btn-secondary text-xs">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
