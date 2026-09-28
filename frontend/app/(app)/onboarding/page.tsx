"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/lib/api-client";
import type { Farm } from "@/lib/types";

const STATES = ["Punjab", "Haryana", "Uttar Pradesh", "Madhya Pradesh", "Maharashtra", "Gujarat", "Rajasthan", "Bihar", "Karnataka", "Tamil Nadu", "Andhra Pradesh", "Other"];
const SEASONS = ["kharif", "rabi", "zaid"];

export default function OnboardingPage() {
  const api = useApi();
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdFarm, setCreatedFarm] = useState<Farm | null>(null);

  const [farmForm, setFarmForm] = useState({
    name: "",
    state: "",
    district: "",
    village_or_city: "",
    area: "",
    area_unit: "acre",
    soil_type: "",
    irrigation_type: "rainfed",
  });

  const [cropForm, setCropForm] = useState({
    crop_name: "",
    variety: "",
    season: "kharif",
    year: new Date().getFullYear(),
    sowing_date: new Date().toISOString().slice(0, 10),
    expected_harvest_date: "",
  });

  async function submitFarm(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const farm = await api.post<Farm>("/farms", {
        ...farmForm,
        area: parseFloat(farmForm.area),
      });
      setCreatedFarm(farm);
      setStep(2);
    } catch (e: any) {
      setError(e.message || "Could not save your farm. Please check the details and try again.");
    } finally {
      setSaving(false);
    }
  }

  async function submitCrop(e: React.FormEvent) {
    e.preventDefault();
    if (!createdFarm) return;
    setSaving(true);
    setError(null);
    try {
      await api.post(`/farms/${createdFarm.id}/crops`, {
        ...cropForm,
        expected_harvest_date: cropForm.expected_harvest_date || null,
      });
      router.push("/dashboard");
    } catch (e: any) {
      setError(e.message || "Could not save your crop. Please check the details and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-semibold text-primary-900">
        {step === 1 ? "Let's set up your farm" : "What are you growing?"}
      </h1>
      <p className="mt-1 text-sm text-primary-600">
        {step === 1
          ? "GPS location is optional — we only need your general area."
          : "You can add more crops and farms any time later."}
      </p>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {step === 1 ? (
        <form onSubmit={submitFarm} className="mt-6 space-y-4">
          <div>
            <label className="label">Farm name</label>
            <input required className="input" value={farmForm.name} onChange={(e) => setFarmForm({ ...farmForm, name: e.target.value })} placeholder="Main Farm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">State</label>
              <select required className="input" value={farmForm.state} onChange={(e) => setFarmForm({ ...farmForm, state: e.target.value })}>
                <option value="">Select</option>
                {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">District</label>
              <input required className="input" value={farmForm.district} onChange={(e) => setFarmForm({ ...farmForm, district: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Village / City (optional)</label>
            <input className="input" value={farmForm.village_or_city} onChange={(e) => setFarmForm({ ...farmForm, village_or_city: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Farm area</label>
              <input required type="number" step="0.01" className="input" value={farmForm.area} onChange={(e) => setFarmForm({ ...farmForm, area: e.target.value })} />
            </div>
            <div>
              <label className="label">Unit</label>
              <select className="input" value={farmForm.area_unit} onChange={(e) => setFarmForm({ ...farmForm, area_unit: e.target.value })}>
                <option value="acre">Acre</option>
                <option value="hectare">Hectare</option>
                <option value="bigha">Bigha</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Soil type (optional)</label>
              <input className="input" value={farmForm.soil_type} onChange={(e) => setFarmForm({ ...farmForm, soil_type: e.target.value })} placeholder="Loamy, Black, Alluvial..." />
            </div>
            <div>
              <label className="label">Irrigation type</label>
              <select className="input" value={farmForm.irrigation_type} onChange={(e) => setFarmForm({ ...farmForm, irrigation_type: e.target.value })}>
                <option value="rainfed">Rainfed</option>
                <option value="canal">Canal</option>
                <option value="borewell">Borewell</option>
                <option value="drip">Drip</option>
                <option value="sprinkler">Sprinkler</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <button disabled={saving} className="btn-primary w-full">{saving ? "Saving..." : "Continue"}</button>
        </form>
      ) : (
        <form onSubmit={submitCrop} className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Crop name</label>
              <input required className="input" value={cropForm.crop_name} onChange={(e) => setCropForm({ ...cropForm, crop_name: e.target.value })} placeholder="Wheat" />
            </div>
            <div>
              <label className="label">Variety (optional)</label>
              <input className="input" value={cropForm.variety} onChange={(e) => setCropForm({ ...cropForm, variety: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Season</label>
              <select className="input" value={cropForm.season} onChange={(e) => setCropForm({ ...cropForm, season: e.target.value })}>
                {SEASONS.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Year</label>
              <input required type="number" className="input" value={cropForm.year} onChange={(e) => setCropForm({ ...cropForm, year: parseInt(e.target.value) })} />
            </div>
          </div>
          <div>
            <label className="label">Sowing date</label>
            <input required type="date" className="input" value={cropForm.sowing_date} onChange={(e) => setCropForm({ ...cropForm, sowing_date: e.target.value })} />
          </div>
          <div>
            <label className="label">Expected harvest date (optional)</label>
            <input type="date" className="input" value={cropForm.expected_harvest_date} onChange={(e) => setCropForm({ ...cropForm, expected_harvest_date: e.target.value })} />
          </div>
          <button disabled={saving} className="btn-primary w-full">{saving ? "Saving..." : "Finish setup"}</button>
        </form>
      )}
    </div>
  );
}
