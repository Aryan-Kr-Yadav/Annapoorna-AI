"use client";

import { useState } from "react";
import { useApi } from "@/lib/api-client";
import { useFarms } from "@/lib/farm-context";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Sprout } from "lucide-react";

export default function CropPlannerPage() {
  const api = useApi();
  const { farms, selectedFarm } = useFarms();
  const [farmId, setFarmId] = useState(selectedFarm?.id || "");
  const [season, setSeason] = useState("kharif");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState<string | null>(null);
  const [sowingDate, setSowingDate] = useState(new Date().toISOString().slice(0, 10));

  async function getSuggestions() {
    if (!farmId) return;
    setLoading(true);
    try {
      const data = await api.post<any[]>("/crop-planner/suggest", { farm_id: farmId, season });
      setSuggestions(data);
    } finally {
      setLoading(false);
    }
  }

  async function createPlan(cropName: string) {
    setCreating(cropName);
    try {
      await api.post(`/farms/${farmId}/crops`, {
        crop_name: cropName,
        season,
        year: new Date().getFullYear(),
        sowing_date: sowingDate,
      });
      alert(`Created a crop plan for ${cropName}. You can find it under this farm's crops.`);
    } finally {
      setCreating(null);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-primary-900">Smart Crop Planner</h1>
      <div className="card space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="label">Farm</label>
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
          {loading ? "Finding options..." : "Get crop options"}
        </button>
      </div>

      {suggestions.length === 0 ? (
        <EmptyState icon={Sprout} title="No suggestions yet" description="Choose a farm and season above to see agronomically compatible crop options." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {suggestions.map((s) => (
            <div key={s.crop} className="card">
              <div className="flex items-center justify-between">
                <p className="font-medium capitalize text-primary-900">{s.crop}</p>
                <Badge variant="default">{s.water_requirement_category} water</Badge>
              </div>
              <p className="mt-2 text-sm text-primary-600">{s.reasoning}</p>
              <button onClick={() => createPlan(s.crop)} disabled={creating === s.crop} className="btn-secondary mt-3 w-full">
                {creating === s.crop ? "Creating..." : "Create crop plan"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
