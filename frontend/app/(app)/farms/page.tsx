"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFarms } from "@/lib/farm-context";
import { useApi } from "@/lib/api-client";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { cn } from "@/lib/utils";
import {
  Tractor,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  MapPin,
  Droplets,
  Sprout,
  ArrowRight,
  LineChart,
  Calendar,
  CheckCircle2,
  Layers,
  X,
  Clock,
  Sparkles,
} from "lucide-react";
import type { Farm, CropCycle, CropTask } from "@/lib/types";

interface FarmDetails {
  crops: CropCycle[];
  tasks: CropTask[];
  loading: boolean;
}

export default function FarmsPage() {
  const router = useRouter();
  const api = useApi();
  const { farms, selectFarm, loading: loadingFarms, error: farmsError, refresh: refreshFarms } = useFarms();

  // Farm details map (crops & tasks per farm)
  const [detailsMap, setDetailsMap] = useState<Record<string, FarmDetails>>({});

  // Menu dropdown state
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Edit Farm Modal State
  const [editingFarm, setEditingFarm] = useState<Farm | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    state: "",
    district: "",
    village_or_city: "",
    area: "",
    area_unit: "acre",
    soil_type: "",
    irrigation_type: "rainfed",
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete Farm Modal State
  const [deletingFarm, setDeletingFarm] = useState<Farm | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Add Farm Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    state: "",
    district: "",
    village_or_city: "",
    area: "",
    area_unit: "acre",
    soil_type: "",
    irrigation_type: "rainfed",
  });
  const [savingAdd, setSavingAdd] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside() {
      setOpenMenuId(null);
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Fetch crops & tasks for all farms in parallel
  useEffect(() => {
    if (farms.length === 0) return;

    farms.forEach((f) => {
      Promise.all([
        api.get<CropCycle[]>(`/farms/${f.id}/crops`).catch(() => []),
        api.get<CropTask[]>(`/farms/${f.id}/tasks`).catch(() => []),
      ]).then(([crops, tasks]) => {
        setDetailsMap((prev) => ({
          ...prev,
          [f.id]: {
            crops: crops || [],
            tasks: tasks || [],
            loading: false,
          },
        }));
      });
    });
  }, [farms, api]);

  const todayStr = new Date().toISOString().slice(0, 10);

  // Compute aggregate metrics
  let totalActiveCrops = 0;
  let totalTasksToday = 0;
  let totalArea = 0;

  farms.forEach((f) => {
    totalArea += Number(f.area) || 0;
    const details = detailsMap[f.id];
    if (details) {
      totalActiveCrops += details.crops.filter((c) => c.status === "active").length;
      totalTasksToday += details.tasks.filter(
        (t) => t.status === "pending" && t.scheduled_date === todayStr
      ).length;
    }
  });

  function startEditFarm(farm: Farm, e?: React.MouseEvent) {
    e?.stopPropagation();
    setOpenMenuId(null);
    setEditingFarm(farm);
    setEditForm({
      name: farm.name,
      state: farm.state,
      district: farm.district,
      village_or_city: farm.village_or_city || "",
      area: String(farm.area),
      area_unit: farm.area_unit,
      soil_type: farm.soil_type || "",
      irrigation_type: farm.irrigation_type,
    });
  }

  async function handleSaveEditFarm(e: React.FormEvent) {
    e.preventDefault();
    if (!editingFarm || !editForm.name.trim() || !editForm.area) return;
    setSavingEdit(true);
    setErrorMsg(null);
    try {
      await api.patch(`/farms/${editingFarm.id}`, {
        name: editForm.name.trim(),
        state: editForm.state.trim(),
        district: editForm.district.trim(),
        village_or_city: editForm.village_or_city.trim() || null,
        area: parseFloat(editForm.area),
        area_unit: editForm.area_unit,
        soil_type: editForm.soil_type.trim() || null,
        irrigation_type: editForm.irrigation_type,
      });
      setEditingFarm(null);
      refreshFarms();
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to update farm details.");
    } finally {
      setSavingEdit(false);
    }
  }

  function startDeleteFarm(farm: Farm, e?: React.MouseEvent) {
    e?.stopPropagation();
    setOpenMenuId(null);
    setDeletingFarm(farm);
  }

  async function handleConfirmDeleteFarm() {
    if (!deletingFarm) return;
    setDeleting(true);
    setErrorMsg(null);
    try {
      await api.delete(`/farms/${deletingFarm.id}`);
      setDeletingFarm(null);
      refreshFarms();
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to delete farm.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleCreateFarm(e: React.FormEvent) {
    e.preventDefault();
    if (!addForm.name.trim() || !addForm.area || !addForm.state.trim() || !addForm.district.trim()) return;
    setSavingAdd(true);
    setErrorMsg(null);
    try {
      await api.post("/farms", {
        name: addForm.name.trim(),
        state: addForm.state.trim(),
        district: addForm.district.trim(),
        village_or_city: addForm.village_or_city.trim() || null,
        area: parseFloat(addForm.area),
        area_unit: addForm.area_unit,
        soil_type: addForm.soil_type.trim() || null,
        irrigation_type: addForm.irrigation_type,
      });
      setShowAddModal(false);
      setAddForm({
        name: "",
        state: "",
        district: "",
        village_or_city: "",
        area: "",
        area_unit: "acre",
        soil_type: "",
        irrigation_type: "rainfed",
      });
      refreshFarms();
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to add farm.");
    } finally {
      setSavingAdd(false);
    }
  }

  if (loadingFarms) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-primary-100 dark:bg-primary-900/40" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (farmsError) {
    return <ErrorState message={farmsError} onRetry={refreshFarms} />;
  }

  return (
    <div className="space-y-6">
      {errorMsg && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-300">
          {errorMsg}
        </div>
      )}

      {/* Header Hub */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary-950 dark:text-primary-100">
            My Farms Hub
          </h1>
          <p className="text-sm text-primary-600 dark:text-primary-400 mt-0.5">
            Manage your land holdings, monitor active crops, and oversee daily field activities.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="btn-primary text-sm shadow-sm"
          >
            <Plus className="h-4 w-4" /> Add Farm
          </button>
        </div>
      </div>

      {/* Real Summary Metrics Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="card">
          <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
            <Tractor className="h-4 w-4" />
            <p className="text-xs font-semibold uppercase tracking-wider">Total Farms</p>
          </div>
          <p className="text-2xl font-bold text-primary-900 dark:text-primary-100 mt-2">
            {farms.length}
          </p>
          <p className="text-[11px] text-primary-400 mt-0.5">
            {farms.length === 1 ? "Registered holding" : "Registered holdings"}
          </p>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <Sprout className="h-4 w-4" />
            <p className="text-xs font-semibold uppercase tracking-wider">Active Crops</p>
          </div>
          <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-400 mt-2">
            {totalActiveCrops}
          </p>
          <p className="text-[11px] text-primary-400 mt-0.5">Currently growing in fields</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <Layers className="h-4 w-4" />
            <p className="text-xs font-semibold uppercase tracking-wider">Total Land Area</p>
          </div>
          <p className="text-2xl font-bold text-primary-900 dark:text-primary-100 mt-2">
            {totalArea.toFixed(1)}{" "}
            <span className="text-xs font-normal text-primary-500">
              {farms[0]?.area_unit || "acres"}
            </span>
          </p>
          <p className="text-[11px] text-primary-400 mt-0.5">Under management</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <Calendar className="h-4 w-4" />
            <p className="text-xs font-semibold uppercase tracking-wider">Tasks Due Today</p>
          </div>
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-400 mt-2">
            {totalTasksToday}
          </p>
          <p className="text-[11px] text-primary-400 mt-0.5">
            {totalTasksToday > 0 ? "Action required today" : "All tasks up to date"}
          </p>
        </div>
      </div>

      {/* Farms List */}
      {farms.length === 0 ? (
        <EmptyState
          icon={Tractor}
          title="No farms registered yet"
          description="Register your first agricultural land holding to plan crops, receive weather advisories, and track farm expenses."
          action={
            <button onClick={() => setShowAddModal(true)} className="btn-primary">
              <Plus className="h-4 w-4" /> Add Farm
            </button>
          }
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {farms.map((farm) => {
            const details = detailsMap[farm.id];
            const activeCrops = details?.crops.filter((c) => c.status === "active") || [];
            const otherCrops = details?.crops.filter((c) => c.status !== "active") || [];
            const tasksToday =
              details?.tasks.filter(
                (t) => t.status === "pending" && t.scheduled_date === todayStr
              ) || [];
            const isMenuOpen = openMenuId === farm.id;

            return (
              <div
                key={farm.id}
                className="card flex flex-col justify-between p-5 space-y-4 hover:border-primary-300 dark:hover:border-primary-700/80 transition-all duration-200 relative group"
              >
                {/* Card Top: Title, Area & Actions Menu */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300">
                        <Tractor className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/farms/${farm.id}`}
                          onClick={() => selectFarm(farm.id)}
                          className="font-bold text-base text-primary-950 dark:text-primary-100 hover:text-primary-600 dark:hover:text-primary-400 transition truncate block"
                        >
                          {farm.name}
                        </Link>
                        <div className="flex items-center gap-1 text-xs text-primary-500 mt-0.5">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">
                            {farm.village_or_city ? `${farm.village_or_city}, ` : ""}
                            {farm.district}, {farm.state}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Overflow Actions Menu [•••] */}
                    <div className="relative shrink-0" onClick={(ev) => ev.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setOpenMenuId(isMenuOpen ? null : farm.id)}
                        className="rounded-lg p-1.5 text-primary-400 hover:text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/40 dark:hover:text-primary-200 transition"
                        title="Farm Options"
                        aria-label="Farm options menu"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>

                      {isMenuOpen && (
                        <div className="absolute right-0 top-full z-40 mt-1 w-44 rounded-xl border border-primary-100 dark:border-primary-800 bg-white dark:bg-[#1a2318] py-1 shadow-xl animate-in fade-in zoom-in-95">
                          <button
                            type="button"
                            onClick={() => {
                              selectFarm(farm.id);
                              router.push(`/farms/${farm.id}`);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-medium text-primary-700 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/40 text-left transition"
                          >
                            <Tractor className="h-3.5 w-3.5 text-primary-500" />
                            Open Farm Hub
                          </button>
                          <button
                            type="button"
                            onClick={(ev) => startEditFarm(farm, ev)}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-medium text-primary-700 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/40 text-left transition"
                          >
                            <Pencil className="h-3.5 w-3.5 text-primary-500" />
                            Edit Farm Details
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              selectFarm(farm.id);
                              router.push(`/farms/${farm.id}`);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-left transition"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Plant New Crop
                          </button>
                          <Link
                            href={`/analytics?farm_id=${farm.id}`}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-medium text-primary-700 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/40 text-left transition"
                          >
                            <LineChart className="h-3.5 w-3.5 text-primary-500" />
                            Farm Analytics
                          </Link>
                          <div className="border-t border-primary-100 dark:border-primary-800 my-1" />
                          <button
                            type="button"
                            onClick={(ev) => startDeleteFarm(farm, ev)}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-left transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete / Archive
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Badges: Area, Irrigation & Soil */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="rounded-lg bg-primary-100/70 dark:bg-primary-900/50 px-2 py-0.5 text-xs font-semibold text-primary-800 dark:text-primary-200">
                      {farm.area} {farm.area_unit}s
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg border border-primary-200 dark:border-primary-800 px-2 py-0.5 text-xs font-medium text-primary-700 dark:text-primary-300 capitalize">
                      <Droplets className="h-3 w-3 text-cyan-600" />
                      {farm.irrigation_type}
                    </span>
                    {farm.soil_type && (
                      <span className="rounded-lg border border-primary-200 dark:border-primary-800 px-2 py-0.5 text-xs font-medium text-primary-600 dark:text-primary-400">
                        Soil: {farm.soil_type}
                      </span>
                    )}
                  </div>
                </div>

                {/* Crops in Field Section */}
                <div className="border-t border-b border-primary-100 dark:border-primary-900/40 py-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-primary-900 dark:text-primary-100">
                      Crops on Field ({details?.crops.length || 0})
                    </span>
                    <Link
                      href={`/farms/${farm.id}`}
                      onClick={() => selectFarm(farm.id)}
                      className="text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center gap-0.5 font-medium"
                    >
                      <Plus className="h-3 w-3" /> Plant
                    </Link>
                  </div>

                  {details?.loading ? (
                    <div className="h-6 w-full animate-pulse rounded bg-primary-100 dark:bg-primary-900/30" />
                  ) : activeCrops.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {activeCrops.map((c) => (
                        <Link
                          key={c.id}
                          href={`/crops/${c.id}`}
                          className="inline-flex items-center gap-1 rounded-full border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 text-xs font-medium text-emerald-900 dark:text-emerald-200 hover:bg-emerald-100 transition"
                        >
                          <Sprout className="h-3 w-3 text-emerald-600" />
                          <span>{c.crop_name}</span>
                          {c.variety && <span className="text-[10px] opacity-75">({c.variety})</span>}
                        </Link>
                      ))}
                      {otherCrops.length > 0 && (
                        <span className="text-[11px] text-primary-400 self-center">
                          +{otherCrops.length} past
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-primary-400 italic">
                      No active crop in season. Click Plant to add one.
                    </p>
                  )}
                </div>

                {/* Activity & Action Footer */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      {tasksToday.length > 0 ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400">
                          <Clock className="h-3.5 w-3.5" />
                          {tasksToday.length} {tasksToday.length === 1 ? "task" : "tasks"} due today
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-primary-500">
                          <CheckCircle2 className="h-3.5 w-3.5 text-primary-600" />
                          No pending tasks today
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Link
                      href={`/farms/${farm.id}`}
                      onClick={() => selectFarm(farm.id)}
                      className="btn-secondary text-xs inline-flex items-center justify-center gap-1 py-1.5"
                    >
                      View Farm <ArrowRight className="h-3 w-3" />
                    </Link>
                    <Link
                      href={`/analytics?farm_id=${farm.id}`}
                      className="btn-secondary text-xs inline-flex items-center justify-center gap-1 py-1.5"
                    >
                      <LineChart className="h-3 w-3" /> Analytics
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Farm Modal */}
      {editingFarm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <form
            onSubmit={handleSaveEditFarm}
            className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#1a2318] p-6 shadow-2xl border border-primary-200 dark:border-primary-800 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-primary-100 dark:border-primary-800 pb-3">
              <h3 className="text-base font-semibold text-primary-900 dark:text-primary-100">
                Edit Farm Holding
              </h3>
              <button
                type="button"
                onClick={() => setEditingFarm(null)}
                className="text-primary-400 hover:text-primary-600 rounded-lg p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div>
              <label className="label">Farm Name</label>
              <input
                required
                className="input"
                placeholder="e.g. Green Valley Farm"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Total Area</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  className="input"
                  value={editForm.area}
                  onChange={(e) => setEditForm({ ...editForm, area: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Area Unit</label>
                <select
                  className="input"
                  value={editForm.area_unit}
                  onChange={(e) => setEditForm({ ...editForm, area_unit: e.target.value as any })}
                >
                  <option value="acre">Acre</option>
                  <option value="hectare">Hectare</option>
                  <option value="bigha">Bigha</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">State</label>
                <input
                  required
                  className="input"
                  value={editForm.state}
                  onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                />
              </div>
              <div>
                <label className="label">District</label>
                <input
                  required
                  className="input"
                  value={editForm.district}
                  onChange={(e) => setEditForm({ ...editForm, district: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Village / City</label>
                <input
                  className="input"
                  value={editForm.village_or_city}
                  onChange={(e) => setEditForm({ ...editForm, village_or_city: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Irrigation Type</label>
                <select
                  className="input"
                  value={editForm.irrigation_type}
                  onChange={(e) =>
                    setEditForm({ ...editForm, irrigation_type: e.target.value as any })
                  }
                >
                  <option value="rainfed">Rainfed</option>
                  <option value="borewell">Borewell</option>
                  <option value="canal">Canal</option>
                  <option value="drip">Drip Irrigation</option>
                  <option value="sprinkler">Sprinkler</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="label">Soil Type (Optional)</label>
                <input
                  className="input"
                  placeholder="e.g. Clay Loam / Alluvial"
                  value={editForm.soil_type}
                  onChange={(e) => setEditForm({ ...editForm, soil_type: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-primary-100 dark:border-primary-800">
              <button
                type="button"
                onClick={() => setEditingFarm(null)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button type="submit" disabled={savingEdit} className="btn-primary text-xs">
                {savingEdit ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Farm Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <form
            onSubmit={handleCreateFarm}
            className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#1a2318] p-6 shadow-2xl border border-primary-200 dark:border-primary-800 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-primary-100 dark:border-primary-800 pb-3">
              <h3 className="text-base font-semibold text-primary-900 dark:text-primary-100">
                Register New Farm
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-primary-400 hover:text-primary-600 rounded-lg p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div>
              <label className="label">Farm Name</label>
              <input
                required
                className="input"
                placeholder="e.g. North Plot / Kisan Farm"
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Total Area</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="e.g. 2.5"
                  className="input"
                  value={addForm.area}
                  onChange={(e) => setAddForm({ ...addForm, area: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Area Unit</label>
                <select
                  className="input"
                  value={addForm.area_unit}
                  onChange={(e) => setAddForm({ ...addForm, area_unit: e.target.value as any })}
                >
                  <option value="acre">Acre</option>
                  <option value="hectare">Hectare</option>
                  <option value="bigha">Bigha</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">State</label>
                <input
                  required
                  className="input"
                  placeholder="e.g. Haryana"
                  value={addForm.state}
                  onChange={(e) => setAddForm({ ...addForm, state: e.target.value })}
                />
              </div>
              <div>
                <label className="label">District</label>
                <input
                  required
                  className="input"
                  placeholder="e.g. Karnal"
                  value={addForm.district}
                  onChange={(e) => setAddForm({ ...addForm, district: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Village / City</label>
                <input
                  className="input"
                  placeholder="Optional"
                  value={addForm.village_or_city}
                  onChange={(e) => setAddForm({ ...addForm, village_or_city: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Irrigation Type</label>
                <select
                  className="input"
                  value={addForm.irrigation_type}
                  onChange={(e) =>
                    setAddForm({ ...addForm, irrigation_type: e.target.value as any })
                  }
                >
                  <option value="rainfed">Rainfed</option>
                  <option value="borewell">Borewell</option>
                  <option value="canal">Canal</option>
                  <option value="drip">Drip Irrigation</option>
                  <option value="sprinkler">Sprinkler</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="label">Soil Type (Optional)</label>
                <input
                  className="input"
                  placeholder="e.g. Clay Loam"
                  value={addForm.soil_type}
                  onChange={(e) => setAddForm({ ...addForm, soil_type: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-primary-100 dark:border-primary-800">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button type="submit" disabled={savingAdd} className="btn-primary text-xs">
                {savingAdd ? "Saving..." : "Create Farm"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingFarm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#1a2318] p-6 shadow-2xl border border-red-200 dark:border-red-900/60 space-y-4">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/60">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-primary-950 dark:text-primary-100">
                  Delete Farm?
                </h3>
                <p className="text-xs text-primary-500">{deletingFarm.name}</p>
              </div>
            </div>

            <p className="text-xs text-primary-600 dark:text-primary-300 leading-relaxed">
              Are you sure you want to delete / archive <strong>{deletingFarm.name}</strong>? All
              recorded crops, tasks, and historical analytics will be safely archived.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-primary-100 dark:border-primary-800">
              <button
                type="button"
                onClick={() => setDeletingFarm(null)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteFarm}
                disabled={deleting}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition"
              >
                {deleting ? "Deleting..." : "Delete Farm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
