import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sprout,
  BookmarkCheck,
  ArrowRight,
  Trash2,
  Sparkles,
  Calendar,
  Tractor,
  Layers,
  CheckCircle2,
  DollarSign,
  Droplets,
  TrendingUp,
  RefreshCw,
  Plus,
} from "lucide-react";
import { useFarms } from "../contexts/FarmContext";
import { useTranslation } from "../contexts/LanguageContext";
import cropPlannerApi from "../api/cropPlanner";
import PageHeader from "../components/common/PageHeader";
import Badge from "../components/common/Badge";
import EmptyState from "../components/common/EmptyState";
import Skeleton from "../components/common/Skeleton";
import ConfirmDialog from "../components/common/ConfirmDialog";
import { formatDate } from "../utils/formatters";

export default function CropPlanner() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { farms, selectedFarm, selectFarm, selectCrop } = useFarms();

  const [activeTab, setActiveTab] = useState("plan"); // 'plan' | 'saved'
  const [farmId, setFarmId] = useState(selectedFarm?.id || "");
  const [season, setSeason] = useState("kharif");
  const [currentStep, setCurrentStep] = useState(1); // 1 to 4

  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savedPlans, setSavedPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);

  const [savingCrop, setSavingCrop] = useState(null);
  const [sowingDate, setSowingDate] = useState(new Date().toISOString().slice(0, 10));
  const [deletePlanTarget, setDeletePlanTarget] = useState(null);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (selectedFarm?.id && !farmId) {
      setFarmId(selectedFarm.id);
    }
  }, [selectedFarm?.id, farmId]);

  const loadSavedPlans = async () => {
    setLoadingPlans(true);
    try {
      const data = await cropPlannerApi.getPlans();
      setSavedPlans(Array.isArray(data) ? data : []);
    } catch {
      setSavedPlans([]);
    } finally {
      setLoadingPlans(false);
    }
  };

  useEffect(() => {
    loadSavedPlans();
  }, []);

  const currentFarmObj = farms.find((f) => f.id === farmId) || selectedFarm;

  const handleGetSuggestions = async () => {
    if (!farmId) return;
    setLoading(true);
    setFeedback(null);
    try {
      const data = await cropPlannerApi.suggest({ farm_id: farmId, season });
      setSuggestions(Array.isArray(data) ? data : []);
      setCurrentStep(4); // Move to review step
    } catch (err) {
      setFeedback({ message: err?.message || "Failed to generate crop recommendations.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlan = async (suggestion) => {
    if (!farmId) return;
    const cropName = suggestion.crop || suggestion.crop_name;
    setSavingCrop(cropName);
    setFeedback(null);
    try {
      await cropPlannerApi.savePlan({
        farm_id: farmId,
        crop_name: cropName,
        season,
        year: new Date().getFullYear(),
        reason: suggestion.reasoning || suggestion.description,
        suggested_sowing_window: sowingDate,
      });
      setFeedback({ message: `Saved plan for "${cropName}" successfully!`, type: "success" });
      loadSavedPlans();
    } catch (err) {
      setFeedback({ message: err?.message || "Failed to save crop plan.", type: "error" });
    } finally {
      setSavingCrop(null);
    }
  };

  const handleStartCropDirectly = async (suggestion) => {
    if (!farmId) return;
    const cropName = suggestion.crop || suggestion.crop_name;
    setSavingCrop(cropName);
    try {
      const saved = await cropPlannerApi.savePlan({
        farm_id: farmId,
        crop_name: cropName,
        season,
        year: new Date().getFullYear(),
        reason: suggestion.reasoning,
        suggested_sowing_window: sowingDate,
      });

      const converted = await cropPlannerApi.convertPlan(saved.id, {
        sowing_date: sowingDate,
      });

      navigate(`/crops/${converted.id}`);
    } catch (err) {
      setFeedback({ message: err?.message || "Could not launch crop cycle.", type: "error" });
    } finally {
      setSavingCrop(null);
    }
  };

  const handleConvertSavedPlan = async (plan) => {
    try {
      const converted = await cropPlannerApi.convertPlan(plan.id, {
        sowing_date: sowingDate,
      });
      navigate(`/crops/${converted.id}`);
    } catch (err) {
      alert("Failed to start crop cycle from plan: " + err.message);
    }
  };

  const handleDeletePlan = async () => {
    if (!deletePlanTarget) return;
    try {
      await cropPlannerApi.deletePlan(deletePlanTarget.id);
      setSavedPlans((prev) => prev.filter((p) => p.id !== deletePlanTarget.id));
      setDeletePlanTarget(null);
    } catch (err) {
      alert("Failed to delete plan: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("cropPlanner.title", "AI Crop Selection & Season Planner")}
        subtitle="Guided agronomic optimization matching soil characteristics, climate season, and market yield projections."
      />

      {feedback && (
        <div
          className={`rounded-xl p-3 text-xs ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
              : "bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-300"
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Top Tabs: Guided Planner vs Saved Plans */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("plan")}
          className={`border-b-2 px-4 py-2.5 text-xs sm:text-sm font-semibold transition ${
            activeTab === "plan"
              ? "border-primary-600 text-primary-700 dark:border-primary-400 dark:text-primary-300"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
          }`}
        >
          Guided Crop Planner
        </button>
        <button
          onClick={() => setActiveTab("saved")}
          className={`border-b-2 px-4 py-2.5 text-xs sm:text-sm font-semibold transition ${
            activeTab === "saved"
              ? "border-primary-600 text-primary-700 dark:border-primary-400 dark:text-primary-300"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
          }`}
        >
          Saved Crop Plans ({savedPlans.length})
        </button>
      </div>

      {/* TAB 1: GUIDED FLOW */}
      {activeTab === "plan" && (
        <div className="space-y-6">
          {/* Step Breadcrumbs */}
          <div className="grid grid-cols-4 gap-2 text-center text-xs font-semibold">
            {[
              { num: 1, label: "Choose Farm" },
              { num: 2, label: "Field Conditions" },
              { num: 3, label: "Season & Target" },
              { num: 4, label: "AI Recommendations" },
            ].map((s) => (
              <div
                key={s.num}
                onClick={() => {
                  if (s.num < currentStep || (s.num === 4 && suggestions.length > 0)) {
                    setCurrentStep(s.num);
                  }
                }}
                className={`cursor-pointer rounded-xl border p-2.5 transition ${
                  currentStep === s.num
                    ? "border-primary-600 bg-primary-50 text-primary-900 dark:border-primary-500 dark:bg-primary-950/40 dark:text-primary-200"
                    : currentStep > s.num
                    ? "border-emerald-300 bg-emerald-50/50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/20"
                    : "border-slate-200 text-slate-400 dark:border-slate-800"
                }`}
              >
                <span className="block text-[10px] uppercase text-slate-400">Step {s.num}</span>
                <span className="truncate">{s.label}</span>
              </div>
            ))}
          </div>

          {/* STEP 1: Select Farm */}
          {currentStep === 1 && (
            <div className="card space-y-4 max-w-xl mx-auto">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Step 1: Select Destination Farm
              </h3>
              <p className="text-xs text-slate-500">
                Choose the land parcel to evaluate soil texture, acreage, and irrigation availability.
              </p>

              <div>
                <label className="label">Your Farms</label>
                <select
                  value={farmId}
                  onChange={(e) => setFarmId(e.target.value)}
                  className="input text-xs sm:text-sm"
                >
                  <option value="">Select a farm...</option>
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.district}, {f.state} • {f.area} {f.area_unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  disabled={!farmId}
                  onClick={() => setCurrentStep(2)}
                  className="btn-primary text-xs"
                >
                  Next: Review Conditions
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Farm Conditions */}
          {currentStep === 2 && currentFarmObj && (
            <div className="card space-y-4 max-w-xl mx-auto">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Step 2: Farm Profile & Field Conditions
              </h3>
              <p className="text-xs text-slate-500">
                These telemetry parameters will be supplied to the agronomic reasoning model.
              </p>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                  <span className="text-slate-400 block">Location</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {currentFarmObj.district}, {currentFarmObj.state}
                  </span>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                  <span className="text-slate-400 block">Cultivable Area</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {currentFarmObj.area} {currentFarmObj.area_unit}
                  </span>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                  <span className="text-slate-400 block">Soil Classification</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {currentFarmObj.soil_type || "Alluvial / Loamy"}
                  </span>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                  <span className="text-slate-400 block">Irrigation System</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {currentFarmObj.irrigation_type || "Rainfed"}
                  </span>
                </div>
              </div>

              <div className="flex justify-between pt-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="btn-secondary text-xs"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="btn-primary text-xs"
                >
                  Next: Select Season
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Season & Sowing Window */}
          {currentStep === 3 && (
            <div className="card space-y-4 max-w-xl mx-auto">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Step 3: Agricultural Season & Sowing Date
              </h3>
              <p className="text-xs text-slate-500">
                Choose the planting season and targeted commencement date.
              </p>

              <div>
                <label className="label">Cropping Season</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "kharif", label: "Kharif (Monsoon)", desc: "June – Oct" },
                    { id: "rabi", label: "Rabi (Winter)", desc: "Oct – March" },
                    { id: "zaid", label: "Zaid (Summer)", desc: "March – June" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSeason(s.id)}
                      className={`rounded-xl border p-3 text-left transition ${
                        season === s.id
                          ? "border-primary-600 bg-primary-50 dark:border-primary-400 dark:bg-primary-950/40"
                          : "border-slate-200 dark:border-slate-800"
                      }`}
                    >
                      <span className="block text-xs font-bold text-slate-900 dark:text-white">
                        {s.label}
                      </span>
                      <span className="block text-[11px] text-slate-400">{s.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Planned Sowing Window</label>
                <input
                  type="date"
                  value={sowingDate}
                  onChange={(e) => setSowingDate(e.target.value)}
                  className="input text-xs sm:text-sm"
                />
              </div>

              <div className="flex justify-between pt-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="btn-secondary text-xs"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleGetSuggestions}
                  className="btn-primary text-xs"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Evaluating with AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                      Generate Crop Plan
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Review AI Recommendations */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Step 4: AI Recommended Crops for {currentFarmObj?.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Calculated for {season.toUpperCase()} season based on soil conditions and local climate.
                  </p>
                </div>
                <button
                  onClick={() => setCurrentStep(3)}
                  className="btn-secondary text-xs"
                >
                  Modify Parameters
                </button>
              </div>

              {suggestions.length === 0 ? (
                <EmptyState
                  icon={Sprout}
                  title="No recommendations generated"
                  description="Try modifying the season or selecting another farm parcel."
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {suggestions.map((sug, idx) => {
                    const cName = sug.crop || sug.crop_name;
                    return (
                      <div
                        key={idx}
                        className="card flex flex-col justify-between space-y-4 border-2 transition hover:border-primary-400 dark:hover:border-primary-600"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge variant="success" className="text-[10px]">
                              {sug.match_score ? `${sug.match_score}% Match` : "Recommended"}
                            </Badge>
                            {sug.expected_duration_days && (
                              <span className="text-[11px] text-slate-400">
                                ~{sug.expected_duration_days} Days
                              </span>
                            )}
                          </div>

                          <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                            {cName}
                          </h4>

                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            {sug.reasoning || sug.description}
                          </p>

                          <div className="space-y-1 pt-2 border-t border-slate-100 text-xs text-slate-500 dark:border-slate-800">
                            {sug.expected_yield && (
                              <div className="flex justify-between">
                                <span>Expected Yield:</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                  {sug.expected_yield}
                                </span>
                              </div>
                            )}
                            {sug.water_requirement && (
                              <div className="flex justify-between">
                                <span>Water Demand:</span>
                                <span className="font-semibold capitalize text-slate-800 dark:text-slate-200">
                                  {sug.water_requirement}
                                </span>
                              </div>
                            )}
                            {sug.market_demand && (
                              <div className="flex justify-between">
                                <span>Market Outlook:</span>
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                  {sug.market_demand}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                          <button
                            type="button"
                            disabled={savingCrop === cName}
                            onClick={() => handleSavePlan(sug)}
                            className="btn-secondary flex-1 text-xs"
                          >
                            <BookmarkCheck className="mr-1 h-3.5 w-3.5" />
                            {savingCrop === cName ? "Saving..." : "Save Plan"}
                          </button>

                          <button
                            type="button"
                            disabled={savingCrop === cName}
                            onClick={() => handleStartCropDirectly(sug)}
                            className="btn-primary flex-1 text-xs"
                          >
                            <Sprout className="mr-1 h-3.5 w-3.5" />
                            Start Crop
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SAVED PLANS */}
      {activeTab === "saved" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Saved Crop Plans & Rotation Blueprints
            </h3>
            <button onClick={() => setActiveTab("plan")} className="btn-primary text-xs">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Create New Plan
            </button>
          </div>

          {loadingPlans ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <Skeleton className="h-36 w-full" />
              <Skeleton className="h-36 w-full" />
            </div>
          ) : savedPlans.length === 0 ? (
            <EmptyState
              icon={BookmarkCheck}
              title="No saved crop plans yet"
              description="Run the Guided Crop Planner to generate and bookmark optimal crops for upcoming seasons."
              actionLabel="Start Planning"
              onAction={() => setActiveTab("plan")}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {savedPlans.map((plan) => {
                const planFarm = farms.find((f) => f.id === plan.farm_id);
                return (
                  <div
                    key={plan.id}
                    className="card flex flex-col justify-between space-y-4 transition hover:border-primary-300 dark:hover:border-primary-800"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="neutral" className="capitalize text-[10px]">
                          {plan.season} {plan.year}
                        </Badge>
                        <span className="text-[11px] text-slate-400">
                          {formatDate(plan.created_at)}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-slate-900 dark:text-white">
                        {plan.crop_name}
                      </h4>

                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Farm: {planFarm?.name || "Selected Farm"}
                      </p>

                      {plan.reason && (
                        <p className="text-xs text-slate-600 line-clamp-2 dark:text-slate-300">
                          {plan.reason}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => handleConvertSavedPlan(plan)}
                        className="btn-primary text-xs"
                      >
                        <Sprout className="mr-1.5 h-3.5 w-3.5" />
                        Start Active Crop
                      </button>

                      <button
                        onClick={() => setDeletePlanTarget(plan)}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletePlanTarget}
        title="Delete Saved Crop Plan"
        message={`Are you sure you want to delete the plan for "${deletePlanTarget?.crop_name}"?`}
        confirmText="Delete"
        variant="danger"
        onConfirm={handleDeletePlan}
        onCancel={() => setDeletePlanTarget(null)}
      />
    </div>
  );
}
