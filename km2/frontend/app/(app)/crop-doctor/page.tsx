"use client";

import { useEffect, useState } from "react";
import { useFarms } from "@/lib/farm-context";
import { useApi } from "@/lib/api-client";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { Stethoscope, Upload } from "lucide-react";
import type { CropCycle, Diagnosis } from "@/lib/types";

export default function CropDoctorPage() {
  const api = useApi();
  const { selectedFarm } = useFarms();
  const [crops, setCrops] = useState<CropCycle[]>([]);
  const [selectedCropId, setSelectedCropId] = useState<string>("");
  const [symptoms, setSymptoms] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [history, setHistory] = useState<Diagnosis[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [result, setResult] = useState<Diagnosis | null>(null);

  useEffect(() => {
    if (!selectedFarm) return;
    api.get<CropCycle[]>(`/farms/${selectedFarm.id}/crops`).then((cs) => {
      const active = cs.filter((c) => c.status === "active");
      setCrops(active);
      if (active[0]) setSelectedCropId(active[0].id);
    });
  }, [selectedFarm?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function loadHistory(cropId: string) {
    setLoadingHistory(true);
    api.get<Diagnosis[]>(`/crops/${cropId}/diagnoses`).then(setHistory).finally(() => setLoadingHistory(false));
  }
  useEffect(() => { if (selectedCropId) loadHistory(selectedCropId); }, [selectedCropId]); // eslint-disable-line react-hooks/exhaustive-deps

  function onFile(f: File | null) {
    setImage(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function analyze() {
    if (!selectedCropId || (!image && !symptoms.trim())) return;
    setAnalyzing(true);
    setResult(null);
    try {
      const form = new FormData();
      form.append("symptoms_reported", symptoms);
      if (image) form.append("image", image);
      const diagnosis = await api.post<Diagnosis>(`/crops/${selectedCropId}/diagnoses`, form, true);
      setResult(diagnosis);
      setSymptoms("");
      onFile(null);
      loadHistory(selectedCropId);
    } finally {
      setAnalyzing(false);
    }
  }

  if (crops.length === 0) {
    return <EmptyState icon={Stethoscope} title="No active crop" description="Add an active crop to this farm to use Crop Doctor." />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-primary-900">Crop Doctor</h1>

      <div className="card space-y-3">
        <label className="label">Crop</label>
        <select className="input" value={selectedCropId} onChange={(e) => setSelectedCropId(e.target.value)}>
          {crops.map((c) => <option key={c.id} value={c.id}>{c.crop_name} — {c.season} {c.year}</option>)}
        </select>

        <label className="label">Symptoms (optional if uploading an image)</label>
        <textarea className="input" rows={2} value={symptoms} onChange={(e) => setSymptoms(e.target.value)} placeholder="Yellowing leaves, brown spots..." />

        <label className="label">Photo (optional if describing symptoms)</label>
        <input type="file" accept="image/jpeg,image/png" onChange={(e) => onFile(e.target.files?.[0] || null)} className="text-sm" />
        {preview && <img src={preview} alt="preview" className="mt-2 max-h-48 rounded-lg" />}

        <button onClick={analyze} disabled={analyzing} className="btn-primary">
          <Upload className="h-4 w-4" /> {analyzing ? "Analyzing..." : "Run analysis"}
        </button>
      </div>

      {result && (
        <div className="card">
          <div className="flex items-center justify-between">
            <p className="font-medium text-primary-900">{result.possible_condition || "No specific condition identified"}</p>
            <Badge variant={result.severity === "high" ? "danger" : result.severity === "medium" ? "warning" : "success"}>{result.severity}</Badge>
          </div>
          <p className="mt-1 text-xs text-primary-500">
            Confidence: {result.confidence_percentage !== null ? `${result.confidence_percentage}%` : "unavailable"}
          </p>
          {result.recommendation && <p className="mt-2 text-sm text-primary-700">{result.recommendation}</p>}
        </div>
      )}

      <h2 className="text-lg font-medium text-primary-900">Inspection history</h2>
      {loadingHistory ? <CardSkeleton /> : history.length === 0 ? (
        <EmptyState title="No inspections yet" description="Your Crop Doctor history will appear here." />
      ) : (
        <div className="card divide-y divide-primary-100">
          {history.map((d) => (
            <div key={d.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-primary-900">{formatDate(d.created_at)} → {d.possible_condition || "Healthy / no issue found"}</p>
                <p className="text-xs text-primary-500">Confidence: {d.confidence_percentage !== null ? `${d.confidence_percentage}%` : "unavailable"}</p>
              </div>
              <Badge variant={d.severity === "high" ? "danger" : d.severity === "medium" ? "warning" : "success"}>{d.severity}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
