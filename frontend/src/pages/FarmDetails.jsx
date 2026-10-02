import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Tractor,
  MapPin,
  Sprout,
  Plus,
  Trash2,
  Pencil,
  Droplets,
  FlaskConical,
  CloudSun,
  Calendar,
  ArrowLeft,
  ArrowRight,
  Clock,
  Layers,
  Copy,
  Check,
} from "lucide-react";
import farmsApi from "../api/farms";
import cropsApi from "../api/crops";
import { useFarms } from "../contexts/FarmContext";
import { PageHeader, SectionHeader } from "../components/common/PageHeader";
import { Badge } from "../components/common/Badge";
import { CardSkeleton } from "../components/common/Skeleton";
import { EmptyState } from "../components/common/EmptyState";
import { ErrorState } from "../components/common/ErrorState";
import { Tabs } from "../components/common/Tabs";
import { FarmFormModal } from "../components/farms/FarmFormModal";
import { CropFormModal } from "../components/farms/CropFormModal";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { formatDate, formatFarmId } from "../utils/formatters";

export function FarmDetails() {
  const { farmId } = useParams();
  const navigate = useNavigate();
  const { selectFarm, refresh: refreshFarms } = useFarms();

  const [farm, setFarm] = useState(null);
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedFarmId, setCopiedFarmId] = useState(false);

  const handleCopyFarmId = (id) => {
    if (!id) return;
    const shortCode = formatFarmId(id);
    navigator.clipboard.writeText(shortCode);
    setCopiedFarmId(true);
    setTimeout(() => setCopiedFarmId(false), 2000);
  };

  // Tab: "overview" | "crops" | "activity"
  const [activeTab, setActiveTab] = useState("overview");

  // Modals
  const [editingFarm, setEditingFarm] = useState(false);
  const [addingCrop, setAddingCrop] = useState(false);
  const [deletingFarm, setDeletingFarm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadFarmData = useCallback(async () => {
    if (!farmId) return;
    setLoading(true);
    setError(null);
    try {
      const [farmData, cropsData] = await Promise.all([
        farmsApi.get(farmId),
        farmsApi.getCrops(farmId),
      ]);
      setFarm(farmData);
      setCrops(Array.isArray(cropsData) ? cropsData : []);
      selectFarm(farmId);
    } catch (err) {
      setError(err.message || "Failed to load farm details.");
    } finally {
      setLoading(false);
    }
  }, [farmId]);

  useEffect(() => {
    loadFarmData();
  }, [loadFarmData]);

  const handleUpdateFarm = async (data) => {
    setActionLoading(true);
    try {
      await farmsApi.update(farmId, data);
      await loadFarmData();
      await refreshFarms();
      setEditingFarm(false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteFarm = async () => {
    setActionLoading(true);
    try {
      await farmsApi.delete(farmId);
      await refreshFarms();
      navigate("/farms");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddCrop = async (cropData) => {
    setActionLoading(true);
    try {
      await cropsApi.create(farmId, cropData);
      await loadFarmData();
      await refreshFarms();
      setAddingCrop(false);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (error || !farm) {
    return (
      <ErrorState
        title="Farm Not Found"
        message={error || "Could not find the requested farm parcel."}
        onRetry={loadFarmData}
      />
    );
  }

  const activeCrops = crops.filter((c) => c.status === "active");
  const pastCrops = crops.filter((c) => c.status !== "active");

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "crops", label: "Crops", count: crops.length },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/farms"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 dark:hover:text-stone-200"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to All Farms</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEditingFarm(true)}
            className="btn-secondary text-xs"
          >
            <Pencil className="h-3.5 w-3.5" />
            <span>Edit Farm</span>
          </button>
          <button
            type="button"
            onClick={() => setAddingCrop(true)}
            className="btn-primary text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Crop</span>
          </button>
          <button
            type="button"
            onClick={() => setDeletingFarm(true)}
            className="p-2 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/40"
            title="Delete farm"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Farm Hero Card */}
      <div className="card space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 dark:bg-primary-900/60 text-primary-700 dark:text-primary-300">
              <Tractor className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-primary-950 dark:text-primary-50">
                  {farm.name}
                </h1>
                <Badge variant="primary">{farm.area} {farm.area_unit || "acres"}</Badge>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-primary-600" />
                <span>
                  {farm.village_or_city ? `${farm.village_or_city}, ` : ""}
                  {farm.district}, {farm.state}
                </span>
              </p>
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => handleCopyFarmId(farm.id)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-primary-200/80 dark:border-[#223d2b] bg-primary-50/60 dark:bg-[#152318] text-xs font-mono text-primary-900 dark:text-emerald-300 hover:bg-primary-100 dark:hover:bg-[#1a2f20] transition group cursor-pointer"
                  title="Click to copy 6-character Farm ID"
                >
                  <span className="text-3xs uppercase font-sans font-bold text-stone-500 dark:text-stone-400">Farm ID:</span>
                  <span className="select-all font-mono font-bold tracking-wider">{formatFarmId(farm.id)}</span>
                  {copiedFarmId ? (
                    <span className="inline-flex items-center gap-0.5 text-3xs font-sans font-bold text-emerald-600 dark:text-emerald-400">
                      <Check className="h-3 w-3 shrink-0" />
                      <span>Copied</span>
                    </span>
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-stone-400 group-hover:text-primary-600 dark:group-hover:text-emerald-300 shrink-0 transition" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Specs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-primary-50 dark:border-primary-950 text-xs">
          <div className="card p-3 bg-stone-50/50 dark:bg-[#151e13]/50">
            <span className="text-2xs text-stone-400 block font-semibold">Soil Type</span>
            <span className="font-bold text-primary-900 dark:text-primary-100 capitalize">
              {farm.soil_type || "Loamy"}
            </span>
          </div>

          <div className="card p-3 bg-stone-50/50 dark:bg-[#151e13]/50">
            <span className="text-2xs text-stone-400 block font-semibold">Irrigation Type</span>
            <span className="font-bold text-primary-900 dark:text-primary-100 capitalize">
              {farm.irrigation_type || "Rainfed"}
            </span>
          </div>

          <div className="card p-3 bg-stone-50/50 dark:bg-[#151e13]/50">
            <span className="text-2xs text-stone-400 block font-semibold">Registered On</span>
            <span className="font-bold text-primary-900 dark:text-primary-100">
              {formatDate(farm.created_at)}
            </span>
          </div>

          <div className="card p-3 bg-stone-50/50 dark:bg-[#151e13]/50">
            <span className="text-2xs text-stone-400 block font-semibold">Active Crops</span>
            <span className="font-bold text-emerald-700 dark:text-emerald-400">
              {activeCrops.length} in field
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Active Crops in Field */}
          <div>
            <SectionHeader
              title="Active Crop Cycles"
              subtitle="Crops currently planted and growing on this farm parcel"
              action={
                <button
                  type="button"
                  onClick={() => setAddingCrop(true)}
                  className="text-xs font-semibold text-primary-700 dark:text-primary-400 hover:underline"
                >
                  + Add Crop
                </button>
              }
            />

            {activeCrops.length === 0 ? (
              <EmptyState
                icon={Sprout}
                title="No active crops in this field"
                description="Plant a new crop or activate a planned crop cycle."
                action={
                  <button
                    type="button"
                    onClick={() => setAddingCrop(true)}
                    className="btn-primary"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Crop Cycle</span>
                  </button>
                }
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {activeCrops.map((c) => (
                  <Link
                    key={c.id}
                    to={`/crops/${c.id}`}
                    className="card p-4 hover:border-primary-300 dark:hover:border-primary-700 transition flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                        <Sprout className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-primary-950 dark:text-primary-50 group-hover:text-primary-600">
                          {c.crop_name} {c.variety ? `(${c.variety})` : ""}
                        </h4>
                        <p className="text-2xs text-stone-400 capitalize mt-0.5">
                          {c.season} {c.year} • Sown {formatDate(c.sowing_date)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="success">Active</Badge>
                      <ArrowRight className="h-4 w-4 text-stone-400 group-hover:translate-x-0.5 transition" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick links to farm weather & analytics */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Link
              to="/weather"
              className="card p-4 hover:border-primary-300 dark:hover:border-primary-700 transition flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <CloudSun className="h-5 w-5 text-amber-500" />
                <div>
                  <h4 className="text-sm font-bold">Weather Intelligence</h4>
                  <p className="text-2xs text-stone-500">View spray windows and rain forecast</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-stone-400" />
            </Link>

            <Link
              to={`/analytics?farm_id=${farm.id}`}
              className="card p-4 hover:border-primary-300 dark:hover:border-primary-700 transition flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Layers className="h-5 w-5 text-primary-600" />
                <div>
                  <h4 className="text-sm font-bold">Farm Analytics & History</h4>
                  <p className="text-2xs text-stone-500">Season comparisons and finances</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-stone-400" />
            </Link>
          </div>
        </div>
      )}

      {/* Tab 2: All Crops */}
      {activeTab === "crops" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold">All Crop Cycles ({crops.length})</h3>
            <button
              type="button"
              onClick={() => setAddingCrop(true)}
              className="btn-primary text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Crop</span>
            </button>
          </div>

          {crops.length === 0 ? (
            <EmptyState
              icon={Sprout}
              title="No crops recorded"
              description="Register the first crop cycle for this farm parcel."
            />
          ) : (
            <div className="card divide-y divide-primary-50 dark:divide-primary-950 p-0 overflow-hidden">
              {crops.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-4 hover:bg-stone-50/50 dark:hover:bg-primary-900/10 transition"
                >
                  <div className="space-y-1">
                    <Link
                      to={`/crops/${c.id}`}
                      className="font-bold text-sm text-primary-950 dark:text-primary-50 hover:underline"
                    >
                      {c.crop_name} {c.variety ? `— ${c.variety}` : ""}
                    </Link>
                    <p className="text-2xs text-stone-400 capitalize">
                      Season: {c.season} {c.year} • Sowing: {formatDate(c.sowing_date)}
                      {c.expected_harvest_date ? ` • Expected Harvest: ${formatDate(c.expected_harvest_date)}` : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={c.status === "active" ? "success" : "neutral"}>
                      {c.status}
                    </Badge>
                    <Link
                      to={`/crops/${c.id}`}
                      className="btn-secondary text-xs py-1 px-2.5"
                    >
                      Crop Diary
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <FarmFormModal
        open={editingFarm}
        initialData={farm}
        onClose={() => setEditingFarm(false)}
        onSubmit={handleUpdateFarm}
        loading={actionLoading}
      />

      <CropFormModal
        open={addingCrop}
        farmName={farm.name}
        onClose={() => setAddingCrop(false)}
        onSubmit={handleAddCrop}
        loading={actionLoading}
      />

      <ConfirmDialog
        open={deletingFarm}
        title="Delete Farm Parcel"
        message={`Are you sure you want to permanently delete "${farm.name}"?`}
        confirmLabel="Delete Farm"
        onClose={() => setDeletingFarm(false)}
        onConfirm={handleDeleteFarm}
        loading={actionLoading}
      />
    </div>
  );
}

export default FarmDetails;
