"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/lib/api-client";
import { useFarms } from "@/lib/farm-context";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { Sprout, BookmarkCheck, ArrowRight, Trash2 } from "lucide-react";

export default function CropPlannerPage() {
  const api = useApi();
  const router = useRouter();
  const { farms, selectedFarm } = useFarms();
  const [farmId, setFarmId] = useState(selectedFarm?.id || "");
  const [season, setSeason] = useState("kharif");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [savedPlans, setSavedPlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [savingCrop, setSavingCrop] = useState<string | null>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [sowingDate, setSowingDate] = useState(new Date().toISOString().slice(0, 10));
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);

  function loadSavedPlans() {
    setLoadingPlans(true);
    api.get<any[]>("/crop-planner/plans")
      .then(setSavedPlans)
      .catch(() => {})
      .finally(() => setLoadingPlans(false));
  }

  useEffect(() => {
    loadSavedPlans();
  }, []);

  async function getSuggestions() {
    if (!farmId) return;
    setLoading(true);
    setFeedback(null);
    try {
      const data = await api.post<any[]>("/crop-planner/suggest", { farm_id: farmId, season });
      setSuggestions(data);
    } catch (e: any) {
      setFeedback({ message: e.message || "Failed to fetch suggestions.", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function handleSavePlan(suggestion: any) {
    if (!farmId) return;
    setSavingCrop(suggestion.crop);
    setFeedback(null);
    try {
      await api.post("/crop-planner/plans", {
        farm_id: farmId,
        crop_name: suggestion.crop,
        season,
        year: new Date().getFullYear(),
        reason: suggestion.reasoning,
        suggested_sowing_window: sowingDate,
      });
      setFeedback({ message: `Saved plan for "${suggestion.crop}" successfully!`, type: "success" });
      loadSavedPlans();
    } catch (e: any) {
      setFeedback({ message: e.message || "Failed to save plan.", type: "error" });
    } finally {
      setSavingCrop(null);
    }
  }

  async function handleStartCropDirectly(cropName: string) {
    if (!farmId) return;
    setSavingCrop(cropName);
    try {
      const saved = await api.post<any>("/crop-planner/plans", {
        farm_id: farmId,
        crop_name: cropName,
        season,
        year: new Date().getFullYear(),
        suggested_sowing_window: sowingDate,
      });

      const converted = await api.post<any>(`/crop-planner/plans/${saved.id}/convert`, {
        sowing_date: sowingDate,
      });

      router.push(`/crops/${converted.id}`);
    } catch (e: any) {
      setFeedback({ message: e.message || "Could not start crop cycle.", type: "error" });
    } finally {
      setSavingCrop(null);
    }
  }

  async function handleConvertPlan(planId: string) {
    setConvertingId(planId);
    setFeedback(null);
    try {
      const res = await api.post<any>(`/crop-planner/plans/${planId}/convert`, {
        sowing_date: sowingDate,
      });
      setFeedback({ message: `Crop started! Navigating to crop details...`, type: "success" });
      router.push(`/crops/${res.id}`);
    } catch (e: any) {
      setFeedback({ message: e.message || "Failed to convert plan.", type: "error" });
    } finally {
      setConvertingId(null);
    }
  }

  async function handleDeletePlan(planId: string) {
    try {
      await api.delete(`/crop-planner/plans/${planId}`);
      loadSavedPlans();
    } catch (e: any) {
      setFeedback({ message: e.message || "Failed to delete plan.", type: "error" });
    }
  }

  const createPlanContent = (
    <div className="space-y-6">
      <div className="card space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="label">Select Farm</label>
            <select className="input" value={farmId} onChange={(e) => setFarmId(e.target.value)}>
              <option value="">Select farm</option>
              {farms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Season</label>
            <select className="input" value={season} onChange={(e) => setSeason(e.target.value)}>
              <option value="kharif">Kharif</option>
              <option value="rabi">Rabi</option>
              <option value="zaid">Zaid</option>
            </select>
          </div>
          <div>
            <label className="label">Planned sowing date</label>
            <input type="date" className="input" value={sowingDate} onChange={(e) => setSowingDate(e.target.value)} />
          </div>
        </div>
        <button onClick={getSuggestions} disabled={!farmId || loading} className="btn-primary">
          {loading ? "Finding options..." : "Get Crop Options"}
        </button>
      </div>

      {feedback && (
        <p className={`rounded-lg p-3 text-sm ${feedback.type === "success" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>
          {feedback.message}
        </p>
      )}

      {suggestions.length === 0 ? (
        <EmptyState icon={Sprout} title="No suggestions generated yet" description="Choose a farm and season above to see agronomically compatible crop options." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {suggestions.map((s) => (
            <div key={s.crop} className="card flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <p className="font-semibold capitalize text-primary-900">{s.crop}</p>
                  <Badge variant="default">{s.water_requirement_category} water</Badge>
                </div>
                <p className="mt-2 text-sm text-primary-600">{s.reasoning}</p>
              </div>
              <div className="flex gap-2 pt-2 border-t border-primary-100">
                <button
                  onClick={() => handleSavePlan(s)}
                  disabled={savingCrop === s.crop}
                  className="btn-secondary flex-1 text-xs"
                >
                  <BookmarkCheck className="h-3.5 w-3.5" /> {savingCrop === s.crop ? "Saving..." : "Save Plan"}
                </button>
                <button
                  onClick={() => handleStartCropDirectly(s.crop)}
                  disabled={savingCrop === s.crop}
                  className="btn-primary flex-1 text-xs"
                >
                  Start This Crop <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const savedPlansContent = (
    <div className="space-y-4">
      {loadingPlans ? (
        <CardSkeleton />
      ) : savedPlans.length === 0 ? (
        <EmptyState icon={BookmarkCheck} title="No saved crop plans" description="Generate crop options in the Create Plan tab and save your preferred choices here." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {savedPlans.map((p) => (
            <div key={p.id} className="card space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold capitalize text-primary-900">{p.crop_name}</p>
                  <p className="text-xs text-primary-500">{p.farm_name || "Farm"} • {p.season} {p.year}</p>
                </div>
                <Badge variant={p.status === "converted" ? "success" : "warning"}>
                  {p.status.toUpperCase()}
                </Badge>
              </div>

              {p.reason && <p className="text-xs text-primary-600 line-clamp-3">{p.reason}</p>}

              <div className="flex items-center justify-between pt-2 border-t border-primary-100">
                {p.status === "converted" ? (
                  <button
                    onClick={() => p.crop_cycle_id && router.push(`/crops/${p.crop_cycle_id}`)}
                    className="btn-secondary w-full text-xs"
                  >
                    View Active Crop
                  </button>
                ) : (
                  <div className="flex w-full gap-2">
                    <button
                      onClick={() => handleConvertPlan(p.id)}
                      disabled={convertingId === p.id}
                      className="btn-primary flex-1 text-xs"
                    >
                      {convertingId === p.id ? "Converting..." : "Start This Crop"}
                    </button>
                    <button
                      onClick={() => handleDeletePlan(p.id)}
                      className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                      title="Delete Plan"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-primary-900">Smart Crop Planner</h1>

      <Tabs
        tabs={[
          { id: "create", label: "Create Plan", content: createPlanContent },
          { id: "saved", label: `Saved Plans (${savedPlans.length})`, content: savedPlansContent },
        ]}
      />
    </div>
  );
}
