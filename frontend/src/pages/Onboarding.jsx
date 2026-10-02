import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sprout, Tractor, ArrowRight, CheckCircle2 } from "lucide-react";
import farmsApi from "../api/farms";
import cropsApi from "../api/crops";
import { useFarms } from "../contexts/FarmContext";

const STATES = [
  "Punjab",
  "Haryana",
  "Uttar Pradesh",
  "Madhya Pradesh",
  "Maharashtra",
  "Gujarat",
  "Rajasthan",
  "Bihar",
  "Karnataka",
  "Tamil Nadu",
  "Andhra Pradesh",
  "West Bengal",
  "Other",
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { refreshFarms, selectFarm, selectCrop } = useFarms();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [createdFarm, setCreatedFarm] = useState(null);

  const [farmForm, setFarmForm] = useState({
    name: "",
    state: "Uttar Pradesh",
    district: "",
    village_or_city: "",
    area: "",
    area_unit: "acre",
    soil_type: "Loamy",
    irrigation_type: "drip",
  });

  const [cropForm, setCropForm] = useState({
    crop_name: "",
    variety: "",
    season: "kharif",
    year: new Date().getFullYear(),
    sowing_date: new Date().toISOString().slice(0, 10),
    expected_harvest_date: "",
  });

  const handleFarmSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const farm = await farmsApi.create({
        ...farmForm,
        area: parseFloat(farmForm.area),
      });
      setCreatedFarm(farm);
      setStep(2);
    } catch (err) {
      setError(err?.message || "Failed to create farm parcel. Please check details.");
    } finally {
      setSaving(false);
    }
  };

  const handleCropSubmit = async (e) => {
    e.preventDefault();
    if (!createdFarm) return;
    setSaving(true);
    setError(null);
    try {
      const crop = await cropsApi.create(createdFarm.id, {
        ...cropForm,
        expected_harvest_date: cropForm.expected_harvest_date || null,
      });

      await refreshFarms();
      selectFarm(createdFarm.id);
      if (crop?.id) selectCrop(crop.id);

      navigate("/dashboard");
    } catch (err) {
      setError(err?.message || "Failed to register initial crop.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-[85vh] items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-1">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-800 dark:bg-primary-950/60 dark:text-primary-200">
            {step === 1 ? <Tractor className="h-6 w-6" /> : <Sprout className="h-6 w-6" />}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {step === 1 ? "Let's Register Your First Farm" : "What crop are you growing?"}
          </h1>
          <p className="text-xs text-slate-500">
            {step === 1
              ? "We need basic acreage and location parameters to initialize micro-climate telemetry."
              : "You can add more crops, soil tests, and tasks anytime."}
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-400">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleFarmSubmit} className="card space-y-4">
            <div>
              <label className="label">Farm Parcel Name</label>
              <input
                required
                type="text"
                placeholder="e.g. Green Valley Farm, North Field"
                value={farmForm.name}
                onChange={(e) => setFarmForm({ ...farmForm, name: e.target.value })}
                className="input text-xs sm:text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">State</label>
                <select
                  required
                  value={farmForm.state}
                  onChange={(e) => setFarmForm({ ...farmForm, state: e.target.value })}
                  className="input text-xs sm:text-sm"
                >
                  {STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">District</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Ghaziabad"
                  value={farmForm.district}
                  onChange={(e) => setFarmForm({ ...farmForm, district: e.target.value })}
                  className="input text-xs sm:text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Total Cultivable Area</label>
                <input
                  required
                  type="number"
                  step="0.1"
                  placeholder="e.g. 2.5"
                  value={farmForm.area}
                  onChange={(e) => setFarmForm({ ...farmForm, area: e.target.value })}
                  className="input text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="label">Measurement Unit</label>
                <select
                  value={farmForm.area_unit}
                  onChange={(e) => setFarmForm({ ...farmForm, area_unit: e.target.value })}
                  className="input text-xs sm:text-sm"
                >
                  <option value="acre">Acres</option>
                  <option value="hectare">Hectares</option>
                  <option value="bigha">Bigha</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Soil Texture</label>
                <select
                  value={farmForm.soil_type}
                  onChange={(e) => setFarmForm({ ...farmForm, soil_type: e.target.value })}
                  className="input text-xs sm:text-sm"
                >
                  <option value="Loamy">Loamy</option>
                  <option value="Clay">Clay</option>
                  <option value="Sandy">Sandy</option>
                  <option value="Black">Black Soil</option>
                  <option value="Alluvial">Alluvial</option>
                </select>
              </div>

              <div>
                <label className="label">Irrigation System</label>
                <select
                  value={farmForm.irrigation_type}
                  onChange={(e) => setFarmForm({ ...farmForm, irrigation_type: e.target.value })}
                  className="input text-xs sm:text-sm"
                >
                  <option value="drip">Drip Irrigation</option>
                  <option value="sprinkler">Sprinkler</option>
                  <option value="flood">Flood / Canal</option>
                  <option value="rainfed">Rainfed</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="btn-primary w-full text-xs sm:text-sm"
            >
              {saving ? "Saving Farm..." : "Continue to Crop Selection"}
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleCropSubmit} className="card space-y-4">
            <div>
              <label className="label">Crop Name</label>
              <input
                required
                type="text"
                placeholder="e.g. Wheat, Mustard, Potato, Cotton"
                value={cropForm.crop_name}
                onChange={(e) => setCropForm({ ...cropForm, crop_name: e.target.value })}
                className="input text-xs sm:text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Variety (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. HD-2967, Sharbati"
                  value={cropForm.variety}
                  onChange={(e) => setCropForm({ ...cropForm, variety: e.target.value })}
                  className="input text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="label">Season</label>
                <select
                  value={cropForm.season}
                  onChange={(e) => setCropForm({ ...cropForm, season: e.target.value })}
                  className="input text-xs sm:text-sm"
                >
                  <option value="kharif">Kharif (Monsoon)</option>
                  <option value="rabi">Rabi (Winter)</option>
                  <option value="zaid">Zaid (Summer)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Sowing Date</label>
                <input
                  required
                  type="date"
                  value={cropForm.sowing_date}
                  onChange={(e) => setCropForm({ ...cropForm, sowing_date: e.target.value })}
                  className="input text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="label">Expected Harvest</label>
                <input
                  type="date"
                  value={cropForm.expected_harvest_date}
                  onChange={(e) => setCropForm({ ...cropForm, expected_harvest_date: e.target.value })}
                  className="input text-xs sm:text-sm"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn-secondary text-xs sm:text-sm"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary flex-1 text-xs sm:text-sm"
              >
                {saving ? "Launching Workspace..." : "Complete Setup & Open Dashboard"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
