import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  Sprout,
  Calendar,
  Clock,
  Droplets,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Plus,
  Trash2,
  Edit2,
  Share2,
  FileText,
  Activity,
  ArrowLeft,
  ChevronRight,
  ShieldAlert,
  ShoppingBag,
  Layers,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import cropsApi from "../api/crops";
import { useFarms } from "../contexts/FarmContext";
import { useTranslation } from "../contexts/LanguageContext";
import PageHeader from "../components/common/PageHeader";
import MetricCard from "../components/common/MetricCard";
import Tabs from "../components/common/Tabs";
import Badge from "../components/common/Badge";
import EmptyState from "../components/common/EmptyState";
import ErrorState from "../components/common/ErrorState";
import Skeleton from "../components/common/Skeleton";
import ConfirmDialog from "../components/common/ConfirmDialog";
import CropLifecycleBar from "../components/crops/CropLifecycleBar";
import ActivityTimeline from "../components/crops/ActivityTimeline";
import TaskFormModal from "../components/crops/TaskFormModal";
import IrrigationFormModal from "../components/crops/IrrigationFormModal";
import ExpenseFormModal from "../components/crops/ExpenseFormModal";
import HarvestFormModal from "../components/crops/HarvestFormModal";
import SaleFormModal from "../components/crops/SaleFormModal";
import DiagnosisResultCard from "../components/crop-doctor/DiagnosisResultCard";
import { formatCurrencyINR, formatDate, formatDateTime } from "../utils/formatters";

export default function CropDetails() {
  const { cropId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { selectedFarm, selectCrop } = useFarms();

  const [crop, setCrop] = useState(null);
  const [lifecycle, setLifecycle] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [irrigationLogs, setIrrigationLogs] = useState([]);
  const [irrigationNext, setIrrigationNext] = useState(null);
  const [soilTests, setSoilTests] = useState([]);
  const [diagnoses, setDiagnoses] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [harvests, setHarvests] = useState([]);
  const [sales, setSales] = useState([]);
  const [seasonReport, setSeasonReport] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals & Actions
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [irrigationModalOpen, setIrrigationModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [harvestModalOpen, setHarvestModalOpen] = useState(false);
  const [saleModalOpen, setSaleModalOpen] = useState(false);
  const [viewingDiagnosis, setViewingDiagnosis] = useState(null);

  // Confirm delete states
  const [deleteTaskTarget, setDeleteTaskTarget] = useState(null);
  const [deleteExpenseTarget, setDeleteExpenseTarget] = useState(null);
  const [deleteIrrigationTarget, setDeleteIrrigationTarget] = useState(null);
  const [deleteCropOpen, setDeleteCropOpen] = useState(false);

  // Active Tab from query param or default
  const activeTab = searchParams.get("tab") || "overview";
  const setActiveTab = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  const loadAllCropData = useCallback(async () => {
    if (!cropId) return;
    setLoading(true);
    setError(null);
    try {
      const [cropRes, lifeRes] = await Promise.all([
        cropsApi.get(cropId),
        cropsApi.getLifecycle(cropId).catch(() => null),
      ]);
      setCrop(cropRes);
      setLifecycle(lifeRes);
      selectCrop(cropId);

      // Load subsidiary data in background
      Promise.allSettled([
        cropsApi.getTasks(cropId).then(setTasks),
        cropsApi.getIrrigation(cropId).then(setIrrigationLogs),
        cropsApi.getIrrigationEstimate(cropId).then(setIrrigationNext),
        cropsApi.getSoilTests(cropId).then(setSoilTests),
        cropsApi.getDiagnoses(cropId).then(setDiagnoses),
        cropsApi.getExpenses(cropId).then(setExpenses),
        cropsApi.getHarvests(cropId).then(setHarvests),
        cropsApi.getSales(cropId).then(setSales),
        cropsApi.getSeasonReport(cropId).then(setSeasonReport),
      ]);
    } catch (err) {
      setError(err?.message || "Failed to load crop cycle details.");
    } finally {
      setLoading(false);
    }
  }, [cropId, selectCrop]);

  useEffect(() => {
    loadAllCropData();
  }, [loadAllCropData]);

  // Tasks actions
  const handleToggleTaskStatus = async (task) => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    try {
      await cropsApi.updateTask(task.id, { status: newStatus });
      const updated = await cropsApi.getTasks(cropId);
      setTasks(updated);
    } catch (err) {
      alert("Failed to update task: " + err.message);
    }
  };

  const handleDeleteTask = async () => {
    if (!deleteTaskTarget) return;
    try {
      await cropsApi.deleteTask(deleteTaskTarget.id);
      setTasks((prev) => prev.filter((t) => t.id !== deleteTaskTarget.id));
      setDeleteTaskTarget(null);
    } catch (err) {
      alert("Failed to delete task: " + err.message);
    }
  };

  // Expense actions
  const handleDeleteExpense = async () => {
    if (!deleteExpenseTarget) return;
    try {
      await cropsApi.deleteExpense(deleteExpenseTarget.id);
      setExpenses((prev) => prev.filter((e) => e.id !== deleteExpenseTarget.id));
      setDeleteExpenseTarget(null);
      // Reload season report
      cropsApi.getSeasonReport(cropId).then(setSeasonReport).catch(() => {});
    } catch (err) {
      alert("Failed to delete expense: " + err.message);
    }
  };

  // Irrigation actions
  const handleDeleteIrrigation = async () => {
    if (!deleteIrrigationTarget) return;
    try {
      await cropsApi.deleteIrrigation(cropId, deleteIrrigationTarget.id);
      setIrrigationLogs((prev) => prev.filter((l) => l.id !== deleteIrrigationTarget.id));
      setDeleteIrrigationTarget(null);
    } catch (err) {
      alert("Failed to delete irrigation log: " + err.message);
    }
  };

  // Crop delete
  const handleDeleteCrop = async () => {
    try {
      await cropsApi.delete(cropId);
      navigate(selectedFarm ? `/farms/${selectedFarm.id}` : "/farms");
    } catch (err) {
      alert("Failed to delete crop cycle: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !crop) {
    return (
      <ErrorState
        title="Crop cycle not found"
        message={error || "Could not retrieve the specified crop details."}
        onRetry={loadAllCropData}
      />
    );
  }

  // Calculate totals
  const totalExpenses = expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  const totalRevenue = sales.reduce((acc, s) => acc + (Number(s.total_sale_value ?? s.total_amount) || 0), 0);
  const totalHarvestQty = harvests.reduce((acc, h) => acc + (Number(h.yield_quantity) || 0), 0);
  const totalSoldQty = sales.reduce((acc, s) => acc + (Number(s.quantity_sold) || 0), 0);
  const remainingInventory = Math.max(0, totalHarvestQty - totalSoldQty);

  const tabsConfig = [
    { id: "overview", label: t("crops.overview", "Overview") },
    { id: "timeline", label: t("crops.timeline", "Timeline") },
    { id: "tasks", label: `${t("tasks.title", "Tasks")} (${tasks.length})` },
    { id: "irrigation", label: t("irrigation.title", "Irrigation") },
    { id: "health", label: `${t("cropDoctor.title", "Health")} (${diagnoses.length})` },
    { id: "expenses", label: `${t("crops.expenses", "Expenses")} (${expenses.length})` },
    { id: "harvest", label: t("crops.harvestSales", "Harvest & Sales") },
    { id: "analytics", label: t("analytics.title", "Analytics") },
  ];

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            onClick={() => navigate(crop.farm_id ? `/farms/${crop.farm_id}` : "/farms")}
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-primary-700 dark:text-slate-400 dark:hover:text-primary-400"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Farm
          </button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {crop.crop_name} {crop.variety && `• ${crop.variety}`}
            </h1>
            <Badge variant={crop.status === "active" ? "success" : "neutral"} className="capitalize">
              {crop.status || "active"}
            </Badge>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {crop.season} {crop.year}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setTaskModalOpen(true)}
            className="btn-secondary text-xs"
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add Task
          </button>
          <button
            onClick={() => setExpenseModalOpen(true)}
            className="btn-secondary text-xs"
          >
            <DollarSign className="mr-1 h-3.5 w-3.5" />
            Add Expense
          </button>
          <button
            onClick={() => setDeleteCropOpen(true)}
            className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
            title="Delete crop cycle"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Lifecycle Hero Bar */}
      <CropLifecycleBar lifecycle={lifecycle} sowingDate={crop.sowing_date} expectedHarvest={crop.expected_harvest_date} />

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard
          label="Total Expenses"
          value={formatCurrencyINR(totalExpenses)}
          icon={DollarSign}
          variant="default"
        />
        <MetricCard
          label="Total Sales"
          value={formatCurrencyINR(totalRevenue)}
          icon={TrendingUp}
          variant={totalRevenue >= totalExpenses ? "success" : "default"}
        />
        <MetricCard
          label="Harvested"
          value={`${totalHarvestQty} kg`}
          subtext={`Sold: ${totalSoldQty} kg`}
          icon={ShoppingBag}
        />
        <MetricCard
          label="Inventory Left"
          value={`${remainingInventory} kg`}
          subtext={remainingInventory > 0 ? "Ready to sell" : "No stock"}
          icon={Layers}
          variant={remainingInventory > 0 ? "warning" : "default"}
        />
      </div>

      {/* Tab Navigation */}
      <Tabs tabs={tabsConfig} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-6 md:col-span-2">
            <div className="card space-y-4">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Crop Cycle Information</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 text-sm">
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Crop Name</span>
                  <p className="font-semibold text-slate-900 dark:text-white">{crop.crop_name}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Variety</span>
                  <p className="font-semibold text-slate-900 dark:text-white">{crop.variety || "Not specified"}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Season & Year</span>
                  <p className="font-semibold capitalize text-slate-900 dark:text-white">{crop.season} {crop.year}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Sowing Date</span>
                  <p className="font-semibold text-slate-900 dark:text-white">{formatDate(crop.sowing_date)}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Expected Harvest</span>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {crop.expected_harvest_date ? formatDate(crop.expected_harvest_date) : "Pending"}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Actual Harvest</span>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {crop.actual_harvest_date ? formatDate(crop.actual_harvest_date) : "In progress"}
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Activities on this crop */}
            <div className="card space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">Digital Crop Diary</h2>
                <button
                  onClick={() => setActiveTab("timeline")}
                  className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                >
                  View full timeline
                </button>
              </div>
              <ActivityTimeline
                crop={crop}
                tasks={tasks}
                irrigationLogs={irrigationLogs}
                diagnoses={diagnoses}
                expenses={expenses}
                harvests={harvests}
                sales={sales}
              />
            </div>
          </div>

          {/* Right column quick cards */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="card space-y-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Field Log Actions</h3>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => setIrrigationModalOpen(true)}
                  className="flex items-center gap-2.5 rounded-lg border border-slate-200 p-2.5 text-left text-xs font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <Droplets className="h-4 w-4 text-sky-500" />
                  Log Irrigation Event
                </button>
                <button
                  onClick={() => setExpenseModalOpen(true)}
                  className="flex items-center gap-2.5 rounded-lg border border-slate-200 p-2.5 text-left text-xs font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <DollarSign className="h-4 w-4 text-amber-500" />
                  Record Seed/Fertilizer Cost
                </button>
                <button
                  onClick={() => setHarvestModalOpen(true)}
                  className="flex items-center gap-2.5 rounded-lg border border-slate-200 p-2.5 text-left text-xs font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <ShoppingBag className="h-4 w-4 text-emerald-500" />
                  Record Crop Harvest
                </button>
                <button
                  onClick={() => setSaleModalOpen(true)}
                  className="flex items-center gap-2.5 rounded-lg border border-slate-200 p-2.5 text-left text-xs font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                  Record Mandi / Market Sale
                </button>
                <button
                  onClick={() => navigate("/crop-doctor")}
                  className="flex items-center gap-2.5 rounded-lg border border-slate-200 p-2.5 text-left text-xs font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <ShieldAlert className="h-4 w-4 text-rose-500" />
                  Diagnose Crop Pathology
                </button>
              </div>
            </div>

            {/* Next Irrigation Advisory */}
            <div className="card space-y-3 bg-gradient-to-br from-sky-50 to-primary-50/40 dark:from-sky-950/20 dark:to-primary-950/20">
              <div className="flex items-center gap-2 text-sky-700 dark:text-sky-300">
                <Droplets className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Water Management</span>
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {irrigationNext?.message || "Regular moisture monitoring recommended."}
              </p>
              {irrigationLogs[0] && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Last irrigated on {formatDate(irrigationLogs[0].date)} ({irrigationLogs[0].method || "Drip"})
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Timeline */}
      {activeTab === "timeline" && (
        <div className="card space-y-6">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Complete Crop Lifecycle Timeline</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Chronological log of sowing, crop doctor checks, irrigation events, tasks, and expenditures.
            </p>
          </div>
          <ActivityTimeline
            crop={crop}
            tasks={tasks}
            irrigationLogs={irrigationLogs}
            diagnoses={diagnoses}
            expenses={expenses}
            harvests={harvests}
            sales={sales}
          />
        </div>
      )}

      {/* Tab 3: Tasks */}
      {activeTab === "tasks" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Field Operations & Tasks</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Scheduled agronomic actions for this specific crop cycle.
              </p>
            </div>
            <button onClick={() => { setEditingTask(null); setTaskModalOpen(true); }} className="btn-primary text-xs">
              <Plus className="mr-1 h-3.5 w-3.5" />
              New Task
            </button>
          </div>

          {tasks.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="No tasks scheduled"
              description="Keep your farm operations on track by scheduling weeding, fertilizer, or irrigation tasks."
              actionLabel="Add First Task"
              onAction={() => setTaskModalOpen(true)}
            />
          ) : (
            <div className="card divide-y divide-slate-100 dark:divide-slate-800 p-0 overflow-hidden">
              {tasks.map((task) => {
                const isCompleted = task.status === "completed";
                return (
                  <div key={task.id} className="flex items-center justify-between p-4 transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => handleToggleTaskStatus(task)}
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                          isCompleted
                            ? "border-emerald-600 bg-emerald-600 text-white"
                            : "border-slate-300 hover:border-emerald-500 dark:border-slate-700"
                        }`}
                      >
                        {isCompleted && <CheckCircle2 className="h-3.5 w-3.5" />}
                      </button>
                      <div>
                        <p className={`text-sm font-medium ${isCompleted ? "line-through text-slate-400 dark:text-slate-500" : "text-slate-900 dark:text-white"}`}>
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">{task.description}</p>
                        )}
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(task.scheduled_date)}
                          </span>
                          <span>•</span>
                          <span className="capitalize">{task.task_type || "General"}</span>
                          {task.priority && (
                            <Badge variant={task.priority === "high" ? "error" : task.priority === "medium" ? "warning" : "neutral"} className="text-[10px]">
                              {task.priority}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setEditingTask(task); setTaskModalOpen(true); }}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTaskTarget(task)}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Irrigation */}
      {activeTab === "irrigation" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Irrigation Management</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track watering events, irrigation methods, and duration.
              </p>
            </div>
            <button onClick={() => setIrrigationModalOpen(true)} className="btn-primary text-xs">
              <Plus className="mr-1 h-3.5 w-3.5" />
              Log Irrigation
            </button>
          </div>

          {irrigationLogs.length === 0 ? (
            <EmptyState
              icon={Droplets}
              title="No irrigation recorded"
              description="Record your watering sessions to maintain healthy soil moisture and optimal yields."
              actionLabel="Record Irrigation"
              onAction={() => setIrrigationModalOpen(true)}
            />
          ) : (
            <div className="card divide-y divide-slate-100 dark:divide-slate-800 p-0 overflow-hidden">
              {irrigationLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
                      <Droplets className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {log.method ? `${log.method.toUpperCase()} Irrigation` : "Watering Session"}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span>{formatDate(log.date)}</span>
                        {log.duration_minutes && <span>• {log.duration_minutes} min</span>}
                        {log.water_amount_liters && <span>• {log.water_amount_liters} Liters</span>}
                      </div>
                      {log.notes && <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">{log.notes}</p>}
                    </div>
                  </div>

                  <button
                    onClick={() => setDeleteIrrigationTarget(log)}
                    className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Health & Crop Doctor */}
      {activeTab === "health" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Crop Health & Pathology Checks</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Visual pathology inspections analyzed by Annapoorna Vision.
              </p>
            </div>
            <button onClick={() => navigate("/crop-doctor")} className="btn-primary text-xs">
              <ShieldAlert className="mr-1 h-3.5 w-3.5" />
              Run New Inspection
            </button>
          </div>

          {diagnoses.length === 0 ? (
            <EmptyState
              icon={ShieldAlert}
              title="No health inspections recorded"
              description="Take or upload photos of leaves, stems, or pests to get instant disease detection and remedy advice."
              actionLabel="Inspect Crop Now"
              onAction={() => navigate("/crop-doctor")}
            />
          ) : (
            <div className="space-y-4">
              {diagnoses.map((diag) => (
                <div key={diag.id} className="card space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 dark:text-slate-400">{formatDate(diag.created_at)}</span>
                      <Badge variant={diag.severity === "high" ? "error" : diag.severity === "medium" ? "warning" : "success"}>
                        {diag.severity || "healthy"}
                      </Badge>
                    </div>
                    {diag.confidence_score && (
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        {Math.round(diag.confidence_score * 100)}% Confidence
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-4 sm:flex-row">
                    {diag.image_url && (
                      <img
                        src={diag.image_url}
                        alt="Crop inspection"
                        className="h-24 w-24 shrink-0 rounded-lg object-cover border border-slate-200 dark:border-slate-800"
                      />
                    )}
                    <div className="flex-1 space-y-1">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {diag.disease_name || diag.condition || "Health Inspection"}
                      </h3>
                      {diag.symptoms_reported && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">Symptoms: {diag.symptoms_reported}</p>
                      )}
                      <p className="text-xs text-slate-700 dark:text-slate-300">
                        {diag.treatment || diag.recommendation || "Review details in diagnosis panel."}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => setViewingDiagnosis(diag)}
                      className="text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400"
                    >
                      View full inspection analysis →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 6: Expenses */}
      {activeTab === "expenses" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Crop Input & Operation Expenses</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track seed, fertilizer, pesticide, fuel, and labor investments.
              </p>
            </div>
            <button onClick={() => { setEditingExpense(null); setExpenseModalOpen(true); }} className="btn-primary text-xs">
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add Expense
            </button>
          </div>

          <div className="rounded-xl border border-primary-200 bg-primary-50/50 p-4 dark:border-primary-900/40 dark:bg-primary-950/20">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary-700 dark:text-primary-300">
              Total Recorded Expense
            </span>
            <p className="text-2xl font-bold text-primary-950 dark:text-primary-100">
              {formatCurrencyINR(totalExpenses)}
            </p>
          </div>

          {expenses.length === 0 ? (
            <EmptyState
              icon={DollarSign}
              title="No expenses logged"
              description="Keep tabs on every rupee spent on seeds, fertilizers, and operations."
              actionLabel="Add Expense"
              onAction={() => setExpenseModalOpen(true)}
            />
          ) : (
            <div className="card divide-y divide-slate-100 dark:divide-slate-800 p-0 overflow-hidden">
              {expenses.map((exp) => (
                <div key={exp.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold capitalize text-slate-900 dark:text-white">
                        {exp.category} {exp.description && `• ${exp.description}`}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(exp.date)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {formatCurrencyINR(exp.amount)}
                    </span>
                    <button
                      onClick={() => { setEditingExpense(exp); setExpenseModalOpen(true); }}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteExpenseTarget(exp)}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 7: Harvest & Sales */}
      {activeTab === "harvest" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Harvest & Commercial Sales</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Record yield harvested and track sales to local mandis or aggregators.
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setHarvestModalOpen(true)} className="btn-secondary text-xs">
                <Plus className="mr-1 h-3.5 w-3.5" />
                Record Harvest
              </button>
              <button onClick={() => setSaleModalOpen(true)} className="btn-primary text-xs">
                <TrendingUp className="mr-1 h-3.5 w-3.5" />
                Record Sale
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card space-y-1">
              <span className="text-xs text-slate-500 dark:text-slate-400">Total Harvested</span>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{totalHarvestQty} kg</p>
            </div>
            <div className="card space-y-1">
              <span className="text-xs text-slate-500 dark:text-slate-400">Total Sold</span>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{totalSoldQty} kg</p>
            </div>
            <div className="card space-y-1">
              <span className="text-xs text-slate-500 dark:text-slate-400">Total Revenue</span>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrencyINR(totalRevenue)}</p>
            </div>
          </div>

          {/* Harvests List */}
          <div className="card space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Harvest Records</h3>
            {harvests.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">No harvest recorded yet.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {harvests.map((h) => (
                  <div key={h.id} className="flex items-center justify-between py-2.5 text-xs">
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white">{h.yield_quantity} {h.unit || "kg"}</span>
                      <span className="ml-2 text-slate-500">{formatDate(h.harvest_date)}</span>
                      {h.quality_grade && <span className="ml-2 text-slate-400">Grade {h.quality_grade}</span>}
                    </div>
                    {h.selling_price_per_unit && (
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {formatCurrencyINR(h.selling_price_per_unit)}/{h.unit || "kg"}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sales List */}
          <div className="card space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Mandi & Market Sales</h3>
            {sales.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">No crop sales recorded yet.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {sales.map((s) => (
                  <div key={s.id} className="flex items-center justify-between py-2.5 text-xs">
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {s.quantity_sold} {s.quantity_unit || s.unit || "quintal"} sold to {s.buyer_name || "Mandi"}
                      </span>
                      <p className="text-slate-500">{formatDate(s.sale_date)}</p>
                    </div>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrencyINR(s.total_sale_value ?? s.total_amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 8: Analytics */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          <div className="card space-y-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Season Financial Performance</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400">Gross Revenue</span>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatCurrencyINR(totalRevenue)}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400">Total Investment</span>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrencyINR(totalExpenses)}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400">Net Profit</span>
                <p className={`text-lg font-bold ${totalRevenue - totalExpenses >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                  {formatCurrencyINR(totalRevenue - totalExpenses)}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400">ROI</span>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  {totalExpenses > 0 ? `${Math.round(((totalRevenue - totalExpenses) / totalExpenses) * 100)}%` : "0%"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      {taskModalOpen && (
        <TaskFormModal
          isOpen={taskModalOpen}
          onClose={() => { setTaskModalOpen(false); setEditingTask(null); }}
          cropId={cropId}
          task={editingTask}
          onSaved={() => cropsApi.getTasks(cropId).then(setTasks)}
        />
      )}

      {irrigationModalOpen && (
        <IrrigationFormModal
          isOpen={irrigationModalOpen}
          onClose={() => setIrrigationModalOpen(false)}
          cropId={cropId}
          onSaved={() => cropsApi.getIrrigation(cropId).then(setIrrigationLogs)}
        />
      )}

      {expenseModalOpen && (
        <ExpenseFormModal
          isOpen={expenseModalOpen}
          onClose={() => { setExpenseModalOpen(false); setEditingExpense(null); }}
          cropId={cropId}
          expense={editingExpense}
          onSaved={() => {
            cropsApi.getExpenses(cropId).then(setExpenses);
            cropsApi.getSeasonReport(cropId).then(setSeasonReport).catch(() => {});
          }}
        />
      )}

      {harvestModalOpen && (
        <HarvestFormModal
          isOpen={harvestModalOpen}
          onClose={() => setHarvestModalOpen(false)}
          cropId={cropId}
          onSaved={() => {
            cropsApi.getHarvests(cropId).then(setHarvests);
            cropsApi.getSales(cropId).then(setSales);
            cropsApi.getSeasonReport(cropId).then(setSeasonReport).catch(() => {});
          }}
        />
      )}

      {saleModalOpen && (
        <SaleFormModal
          isOpen={saleModalOpen}
          onClose={() => setSaleModalOpen(false)}
          cropId={cropId}
          remainingInventory={remainingInventory}
          onSaved={() => {
            cropsApi.getSales(cropId).then(setSales);
            cropsApi.getSeasonReport(cropId).then(setSeasonReport).catch(() => {});
          }}
        />
      )}

      {/* Diagnosis Details Modal */}
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

      {/* Delete Task Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTaskTarget}
        title="Delete Task"
        message={`Are you sure you want to delete "${deleteTaskTarget?.title}"? This cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        onConfirm={handleDeleteTask}
        onCancel={() => setDeleteTaskTarget(null)}
      />

      {/* Delete Expense Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteExpenseTarget}
        title="Delete Expense"
        message={`Are you sure you want to delete this expense of ${formatCurrencyINR(deleteExpenseTarget?.amount || 0)}?`}
        confirmText="Delete"
        variant="danger"
        onConfirm={handleDeleteExpense}
        onCancel={() => setDeleteExpenseTarget(null)}
      />

      {/* Delete Irrigation Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteIrrigationTarget}
        title="Delete Irrigation Record"
        message="Are you sure you want to delete this irrigation event?"
        confirmText="Delete"
        variant="danger"
        onConfirm={handleDeleteIrrigation}
        onCancel={() => setDeleteIrrigationTarget(null)}
      />

      {/* Delete Crop Confirmation */}
      <ConfirmDialog
        isOpen={deleteCropOpen}
        title="Delete Crop Cycle"
        message={`Are you sure you want to delete this entire ${crop.crop_name} crop cycle along with all related logs? This action is permanent.`}
        confirmText="Delete Crop"
        variant="danger"
        onConfirm={handleDeleteCrop}
        onCancel={() => setDeleteCropOpen(false)}
      />
    </div>
  );
}
