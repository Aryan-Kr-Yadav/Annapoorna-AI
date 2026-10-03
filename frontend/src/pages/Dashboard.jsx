import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Tractor,
  Sprout,
  CheckSquare,
  Droplets,
  CloudSun,
  AlertTriangle,
  Stethoscope,
  DollarSign,
  Compass,
  ArrowRight,
  Sparkles,
  Check,
  Plus,
  Clock,
  ShieldCheck,
  Copy,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useFarms } from "../contexts/FarmContext";
import { useTranslation } from "../contexts/LanguageContext";
import dashboardApi from "../api/dashboard";
import itemsApi from "../api/items";
import { CardSkeleton } from "../components/common/Skeleton";
import { EmptyState } from "../components/common/EmptyState";
import { ErrorState } from "../components/common/ErrorState";
import { Badge } from "../components/common/Badge";
import { PageHeader, SectionHeader } from "../components/common/PageHeader";
import { MetricCard } from "../components/common/MetricCard";
import { formatDate, formatDateTime, formatCurrencyINR, getGreeting, formatFarmId } from "../utils/formatters";
import { cn } from "../utils/cn";

export function Dashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { farms, selectedFarm, selectedCrop, selectCrop, loading: farmsLoading } = useFarms();

  const [data, setData] = useState(null);
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

  const loadDashboard = useCallback(async () => {
    if (!selectedFarm) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardApi.get(selectedFarm.id, selectedCrop?.id);
      setData(res);
      if (res.active_crop && !selectedCrop) {
        selectCrop(res.active_crop.crop_cycle_id);
      }
    } catch (err) {
      setError(err.message || "Failed to load farm dashboard.");
    } finally {
      setLoading(false);
    }
  }, [selectedFarm?.id, selectedCrop?.id]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleToggleTask = async (taskId, currentCompleted) => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        todays_tasks: prev.todays_tasks.map((task) =>
          task.id === taskId ? { ...task, is_completed: !currentCompleted } : task
        ),
      };
    });

    try {
      await itemsApi.updateTask(taskId, { is_completed: !currentCompleted });
    } catch {
      // Revert if error
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          todays_tasks: prev.todays_tasks.map((task) =>
            task.id === taskId ? { ...task, is_completed: currentCompleted } : task
          ),
        };
      });
    }
  };

  if (farmsLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (farms.length === 0) {
    return (
      <EmptyState
        icon={Tractor}
        title="Welcome to Annapoorna AI"
        description="Let's set up your first farm parcel and crop cycle to unlock personalized agricultural intelligence."
        action={
          <Link to="/onboarding" className="btn-primary">
            <Plus className="h-4 w-4" />
            <span>Set Up My First Farm</span>
          </Link>
        }
      />
    );
  }

  const intel = data?.weather_intelligence;
  const todaysTasks = data?.todays_tasks || [];
  const alerts = data?.alerts || [];
  const activeCrops = data?.all_active_crops || [];
  const recentInspections = data?.recent_inspections || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Greeting & Active Context Banner */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border)] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary-700 dark:text-primary-400">
              {getGreeting()}
            </span>
            <span className="text-stone-300 dark:text-stone-700">•</span>
            <span className="text-2xs text-[var(--foreground-muted)]">{formatDate(new Date())}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)] mt-0.5">
            {user?.name ? `Namaste, ${user.name}` : "Namaste, Farmer"}
          </h1>
          <div className="text-xs text-[var(--foreground-muted)] mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="flex items-center gap-1.5 font-medium text-[var(--foreground)]">
              <Tractor className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400 shrink-0" />
              <span>
                {selectedFarm?.name} — {selectedFarm?.district}, {selectedFarm?.state}
              </span>
            </span>
            {selectedCrop && (
              <>
                <span className="text-stone-300 dark:text-stone-700">•</span>
                <span className="font-semibold text-primary-700 dark:text-primary-400">
                  {selectedCrop.crop_name} ({selectedCrop.season})
                </span>
              </>
            )}
            {selectedFarm?.id && (
              <>
                <span className="text-stone-300 dark:text-stone-700">•</span>
                <button
                  type="button"
                  onClick={() => handleCopyFarmId(selectedFarm.id)}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-[var(--border)] bg-[var(--surface-secondary)] text-2xs font-mono text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-tertiary)] transition group cursor-pointer"
                  title="Click to copy 6-character Farm ID"
                >
                  <span className="font-sans font-semibold text-[var(--foreground-muted)]">Farm ID:</span>
                  <span className="select-all font-mono font-bold tracking-wider">{formatFarmId(selectedFarm.id)}</span>
                  {copiedFarmId ? (
                    <span className="inline-flex items-center gap-0.5 text-3xs font-sans font-bold text-emerald-600 dark:text-emerald-400">
                      <Check className="h-2.5 w-2.5 shrink-0" />
                      <span>Copied</span>
                    </span>
                  ) : (
                    <Copy className="h-2.5 w-2.5 text-stone-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 shrink-0 transition" />
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Quick actions top bar */}
        <div className="flex items-center gap-2">
          <Link to="/assistant" className="btn-primary text-xs">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{t("dashboard.ask_annapoorna", "Ask Annapoorna")}</span>
          </Link>
          <Link to="/crop-doctor" className="btn-secondary text-xs">
            <Stethoscope className="h-3.5 w-3.5" />
            <span>{t("dashboard.inspect_crop", "Inspect Crop")}</span>
          </Link>
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={loadDashboard} />}

      {/* TODAY'S FARM BRIEF (Section 16) */}
      <div>
        <SectionHeader
          title={t("dashboard.farm_brief_title", "Today's Farm Brief")}
          subtitle={t("dashboard.farm_brief_sub", "Real-time agronomic conditions and alerts for this plot")}
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <MetricCard
            icon={CloudSun}
            label={t("dashboard.weather_condition", "Weather Condition")}
            value={
              data?.weather?.current?.temperature !== undefined
                ? `${Math.round(data.weather.current.temperature)}°C`
                : "28°C"
            }
            subtext={intel?.rain_advisory || "Dry conditions expected"}
            variant="amber"
            onClick={() => navigate("/weather")}
          />

          <MetricCard
            icon={CheckSquare}
            label={t("dashboard.pending_tasks", "Pending Tasks")}
            value={todaysTasks.filter((t) => !t.is_completed).length}
            subtext={
              todaysTasks.length > 0
                ? `${todaysTasks.length} tasks scheduled for today`
                : "No urgent tasks today"
            }
            variant="emerald"
            onClick={() => navigate("/tasks")}
          />

          <MetricCard
            icon={Droplets}
            label={t("dashboard.irrigation", "Irrigation Status")}
            value={
              data?.irrigation?.days_until_next !== null &&
              data?.irrigation?.days_until_next !== undefined
                ? `In ${data.irrigation.days_until_next} days`
                : "Optimal"
            }
            subtext={data?.irrigation?.note || "Soil moisture adequate"}
            variant="blue"
            onClick={() => navigate("/irrigation")}
          />

          <MetricCard
            icon={Stethoscope}
            label={t("dashboard.crop_health", "Crop Health")}
            value={
              recentInspections.length > 0
                ? recentInspections[0].severity?.toUpperCase() || "MONITORING"
                : "Healthy"
            }
            subtext={
              recentInspections.length > 0
                ? recentInspections[0].possible_condition || "No disease detected"
                : "No active disease alerts"
            }
            variant="primary"
            onClick={() => navigate("/crop-doctor")}
          />
        </div>
      </div>

      {/* ACTIVE CROPS SELECTOR CHIPS (Section 13) */}
      {activeCrops.length > 0 && (
        <div className="card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)]">
                Active Crops in {selectedFarm?.name}
              </h3>
              <p className="text-2xs text-[var(--foreground-muted)]">Click a crop to switch current farm context</p>
            </div>
            <Link
              to={`/farms/${selectedFarm?.id}`}
              className="text-xs font-semibold text-primary-700 dark:text-primary-400 hover:underline"
            >
              + Add Crop
            </Link>
          </div>

          <div className="flex flex-wrap gap-2">
            {activeCrops.map((c) => {
              const isSelected = c.crop_cycle_id === selectedCrop?.id;
              return (
                <button
                  key={c.crop_cycle_id}
                  type="button"
                  onClick={() => selectCrop(c.crop_cycle_id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition cursor-pointer",
                    isSelected
                      ? "bg-primary-700 text-white border-primary-800 shadow-xs dark:bg-primary-600 dark:border-primary-500"
                      : "bg-[var(--surface)] border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--surface-secondary)]"
                  )}
                >
                  <Sprout className="h-4 w-4 shrink-0" />
                  <span>{c.crop_name}</span>
                  <span
                    className={cn(
                      "text-2xs px-1.5 py-0.5 rounded-md font-medium",
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-[var(--surface-secondary)] text-[var(--foreground-muted)]"
                    )}
                  >
                    Day {c.day_number || 1} • {c.current_stage || "Tillering"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ALERTS BANNER (If any) */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((al, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-amber-950 dark:text-amber-200"
            >
              <AlertTriangle className="h-4.5 w-4.5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-xs font-bold">{al.title}</h4>
                <p className="text-xs text-amber-900/90 dark:text-amber-300/80 mt-0.5">
                  {al.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* GRID: TODAY'S TASKS & QUICK ACTIONS */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today's Tasks */}
        <div className="lg:col-span-2 card space-y-3">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[var(--foreground)]">
                {t("dashboard.todays_tasks", "Today's Farm Tasks")}
              </h3>
              <p className="text-2xs text-[var(--foreground-muted)]">{t("dashboard.tasks_subtext", "Mark completed activities as you work")}</p>
            </div>
            <Link to="/tasks" className="text-xs font-semibold text-primary-700 dark:text-primary-400 hover:underline">
              {t("dashboard.view_all_tasks", "View All Tasks →")}
            </Link>
          </div>

          {todaysTasks.length === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--foreground-muted)]">
              {t("dashboard.no_tasks_today", "No tasks scheduled for today. You're all caught up!")}
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-subtle)]">
              {todaysTasks.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between py-2.5 hover:bg-[var(--surface-secondary)]/60 px-1.5 rounded-lg transition"
                >
                  <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={!!t.is_completed}
                      onChange={() => handleToggleTask(t.id, !!t.is_completed)}
                      className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500 cursor-pointer"
                    />
                    <span
                      className={cn(
                        "text-xs font-medium truncate",
                        t.is_completed
                          ? "line-through text-[var(--foreground-muted)] opacity-60"
                          : "text-[var(--foreground)] font-semibold"
                      )}
                    >
                      {t.title}
                    </span>
                  </label>
                  <span className="text-3xs uppercase font-bold px-2 py-0.5 rounded-full bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--foreground-muted)]">
                    {t.task_type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Operations & Shortcuts */}
        <div className="card space-y-3">
          <h3 className="text-sm font-bold text-[var(--foreground)] border-b border-[var(--border)] pb-3">
            {t("dashboard.quick_actions", "Quick Actions")}
          </h3>

          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/irrigation"
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)]/50 hover:border-primary-400 dark:hover:border-primary-700 transition text-center group"
            >
              <Droplets className="h-5 w-5 text-sky-600 dark:text-sky-400 mb-1 group-hover:scale-110 transition" />
              <span className="text-xs font-bold text-[var(--foreground)]">
                {t("dashboard.log_water", "Log Water")}
              </span>
              <span className="text-3xs text-[var(--foreground-muted)]">{t("nav.irrigation", "Irrigation")}</span>
            </Link>

            <Link
              to={selectedCrop ? `/crops/${selectedCrop.id}?tab=expenses` : "/farms"}
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)]/50 hover:border-primary-400 dark:hover:border-primary-700 transition text-center group"
            >
              <DollarSign className="h-5 w-5 text-amber-600 dark:text-amber-400 mb-1 group-hover:scale-110 transition" />
              <span className="text-xs font-bold text-[var(--foreground)]">
                {t("dashboard.add_cost", "Add Cost")}
              </span>
              <span className="text-3xs text-[var(--foreground-muted)]">{t("crop.expenses", "Expense")}</span>
            </Link>

            <Link
              to="/crop-doctor"
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)]/50 hover:border-primary-400 dark:hover:border-primary-700 transition text-center group"
            >
              <Stethoscope className="h-5 w-5 text-purple-600 dark:text-purple-400 mb-1 group-hover:scale-110 transition" />
              <span className="text-xs font-bold text-[var(--foreground)]">
                {t("dashboard.scan_crop", "Scan Crop")}
              </span>
              <span className="text-3xs text-[var(--foreground-muted)]">{t("nav.crop_doctor", "Crop Doctor")}</span>
            </Link>

            <Link
              to="/crop-planner"
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)]/50 hover:border-primary-400 dark:hover:border-primary-700 transition text-center group"
            >
              <Compass className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mb-1 group-hover:scale-110 transition" />
              <span className="text-xs font-bold text-[var(--foreground)]">
                {t("dashboard.crop_plan", "Crop Plan")}
              </span>
              <span className="text-3xs text-[var(--foreground-muted)]">{t("nav.crop_planner", "AI Rotation")}</span>
            </Link>
          </div>

          {/* Crop Diary Shortcut */}
          {selectedCrop && (
            <Link
              to={`/crops/${selectedCrop.id}`}
              className="flex items-center justify-between p-3 rounded-xl bg-primary-50 dark:bg-primary-950/60 border border-primary-200 dark:border-primary-800 text-xs font-bold text-primary-900 dark:text-primary-200 hover:bg-primary-100 transition mt-2"
            >
              <div className="flex items-center gap-2">
                <Sprout className="h-4 w-4 text-primary-600" />
                <span>{t("dashboard.open_diary", "Open Complete Crop Diary")}</span>
              </div>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
