"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useApi } from "@/lib/api-client";
import { useFarms } from "@/lib/farm-context";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Badge } from "@/components/ui/Badge";
import { formatCurrencyINR, formatDate } from "@/lib/utils";
import {
  CloudSun,
  Droplets,
  Sprout,
  CheckSquare,
  AlertTriangle,
  Wallet,
  DollarSign,
  Compass,
  Stethoscope,
  ArrowRight,
  Sparkles,
  Tractor,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardData } from "@/lib/types";

function getGreeting(d: Date): string {
  const h = d.getHours();
  if (h >= 5 && h < 12) return "Good Morning";
  if (h >= 12 && h < 17) return "Good Afternoon";
  if (h >= 17 && h < 21) return "Good Evening";
  return "Good Night";
}

function formatDateTime(d: Date): string {
  const weekday = new Intl.DateTimeFormat(undefined, { weekday: "long" }).format(d);
  const day = new Intl.DateTimeFormat(undefined, { day: "numeric" }).format(d);
  const month = new Intl.DateTimeFormat(undefined, { month: "long" }).format(d);
  const time = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);

  return `${weekday}, ${day} ${month} • ${time}`;
}

export default function DashboardPage() {
  const api = useApi();
  const { user } = useAuth();
  const { selectedFarm, selectedCrop, selectCrop, farms, loading: farmsLoading } = useFarms();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Client-side date/time tracking to prevent Next.js SSR hydration mismatches
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setMounted(true);
    const current = new Date();
    setNow(current);

    const msUntilNextMinute = (60 - current.getSeconds()) * 1000 - current.getMilliseconds();
    let intervalId: NodeJS.Timeout | null = null;
    const timeoutId = setTimeout(() => {
      setNow(new Date());
      intervalId = setInterval(() => {
        setNow(new Date());
      }, 60000);
    }, Math.max(msUntilNextMinute, 1000));

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const fullName = user?.name || user?.full_name || "";
  const firstName = fullName.trim() ? fullName.trim().split(/\s+/)[0] : "";
  const greetingText = now ? getGreeting(now) : "Good Morning";
  const greetingDisplay = firstName ? `${greetingText}, ${firstName}` : greetingText;

  const load = useCallback(() => {
    if (!selectedFarm) return;
    setLoading(true);
    setError(null);

    const url = selectedCrop
      ? `/dashboard/${selectedFarm.id}?crop_cycle_id=${selectedCrop.id}`
      : `/dashboard/${selectedFarm.id}`;

    api
      .get<DashboardData>(url)
      .then((d) => {
        setData(d);
        // If active crop in dashboard response is different from selectedCrop and no crop selected, sync it
        if (d.active_crop && !selectedCrop) {
          selectCrop(d.active_crop.crop_cycle_id);
        }
      })
      .catch((e) => setError(e.message || "Could not load your dashboard."))
      .finally(() => setLoading(false));
  }, [selectedFarm?.id, selectedCrop?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
  }, [load]);

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
        icon={Sprout}
        title="Let's set up your first farm"
        description="Add your farm and current crop to see your personalized dashboard."
        action={
          <Link href="/onboarding" className="btn-primary">
            Set up farm
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Greeting & Farm Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-primary-950">
            {mounted ? greetingDisplay : "Good Morning"}
          </h1>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-primary-600 font-medium">
            <span className="flex items-center gap-1">
              <Tractor className="h-3.5 w-3.5 text-primary-500" />
              {selectedFarm?.name} ({selectedFarm?.district}, {selectedFarm?.state})
            </span>
            {mounted && now && (
              <>
                <span>•</span>
                <span className="text-primary-500">{formatDateTime(now)}</span>
              </>
            )}
          </div>
        </div>

        {data?.active_crop && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs text-emerald-900 font-medium">
            <Sprout className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>
              Active Crop: <strong>{data.active_crop.crop_name}</strong> ({data.active_crop.season})
            </span>
          </div>
        )}
      </div>

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      )}

      {error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && data && (
        <>
          {/* Unsold Harvest Alert Banner */}
          {data.unsold_harvests && data.unsold_harvests.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-amber-950">Unsold Harvest Inventory</h3>
                    <p className="text-xs text-amber-800 mt-0.5">
                      You have unsold harvested produce ready to be recorded for sale:{" "}
                      {data.unsold_harvests.map((u, idx) => (
                        <strong key={u.crop_cycle_id}>
                          {u.remaining_quantity} {u.unit} of {u.crop_name}
                          {idx < data.unsold_harvests!.length - 1 ? ", " : ""}
                        </strong>
                      ))}
                    </p>
                  </div>
                </div>
                <Link
                  href={data.active_crop ? `/crops/${data.active_crop.crop_cycle_id}` : `/farms/${selectedFarm?.id}`}
                  className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition"
                >
                  Record Sale →
                </Link>
              </div>
            </div>
          )}

          {/* ACTIVE CROPS SELECTOR CARDS (Multi-Crop Support) */}
          {data.all_active_crops && data.all_active_crops.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-primary-500">
                  Active Crops on this Farm ({data.all_active_crops.length})
                </h2>
                <Link
                  href={`/farms/${selectedFarm?.id}`}
                  className="text-xs font-medium text-primary-600 hover:text-primary-900 underline"
                >
                  Manage Crops →
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {data.all_active_crops.map((c) => {
                  const isSelected = selectedCrop?.id === c.crop_cycle_id || c.is_selected;
                  return (
                    <button
                      key={c.crop_cycle_id}
                      type="button"
                      onClick={() => selectCrop(c.crop_cycle_id)}
                      className={cn(
                        "flex items-start justify-between rounded-xl border p-3.5 text-left transition-all duration-150",
                        isSelected
                          ? "border-emerald-500 bg-gradient-to-br from-emerald-50 to-white shadow-sm ring-2 ring-emerald-500/20"
                          : "border-primary-100 bg-white hover:border-primary-300 hover:bg-primary-50/40"
                      )}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <Sprout className={cn("h-4 w-4 shrink-0", isSelected ? "text-emerald-600" : "text-primary-500")} />
                          <p className="font-bold text-sm text-primary-950 truncate">{c.crop_name}</p>
                        </div>
                        <p className="mt-1 text-xs text-primary-600 font-medium">
                          {c.current_stage || "Growing"} • Day {c.day_number}
                        </p>
                        <p className="text-[11px] text-primary-400 capitalize">{c.season}</p>
                      </div>

                      <div className="text-right shrink-0">
                        {isSelected ? (
                          <span className="inline-flex rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs">
                            Active Context
                          </span>
                        ) : (
                          <span className="text-xs text-primary-400 hover:text-primary-700">Switch →</span>
                        )}
                        {c.progress_percentage !== null && (
                          <p className="mt-2 text-[10px] text-primary-500 font-medium">
                            {c.progress_percentage}% completed
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Crop Detail Progress Banner */}
          {data.active_crop ? (
            <div className="card bg-gradient-to-br from-white via-primary-50/20 to-emerald-50/30">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                    Currently Viewing: {data.active_crop.season}
                  </p>
                  <h2 className="text-xl font-bold text-primary-950 mt-0.5">
                    {data.active_crop.crop_name} — {data.active_crop.current_stage || "Active Growth"}
                  </h2>
                  <p className="text-xs text-primary-600 mt-1">
                    Day {data.active_crop.day_number} in field •{" "}
                    {data.active_crop.progress_percentage ?? "—"}% through estimated lifecycle
                  </p>
                </div>

                <Link
                  href={`/crops/${data.active_crop.crop_cycle_id}`}
                  className="btn-secondary text-xs inline-flex items-center gap-1.5"
                >
                  View Complete Crop Diary <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {data.active_crop.progress_percentage !== null && (
                <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-primary-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-primary-600 transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(5, data.active_crop.progress_percentage))}%` }}
                  />
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              title="No active crop selected"
              description="Add an active crop cycle or choose a saved plan to track lifecycle and tasks for this farm."
              action={
                <Link href={`/farms/${selectedFarm?.id}`} className="btn-primary">
                  Plant a Crop
                </Link>
              }
            />
          )}

          {/* Dashboard Intelligence Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Weather Intelligence Card */}
            <div className="card">
              <div className="flex items-center gap-2 text-primary-500">
                <CloudSun className="h-4 w-4 text-sky-500" />
                <span className="text-xs font-semibold uppercase tracking-wider">Weather Intelligence</span>
              </div>
              {data.weather?.available ? (
                <>
                  <div className="mt-2.5 flex items-baseline justify-between">
                    <p className="text-2xl font-bold text-primary-950">
                      {Math.round(data.weather.current?.temperature_c)}°C
                    </p>
                    {data.weather_intelligence && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-sky-100 text-sky-900">
                        Score: {data.weather_intelligence.farming_condition_score}/100
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-medium text-primary-600 capitalize mt-0.5">
                    {data.weather.current?.condition} • Wind {data.weather.current?.wind_kph} km/h
                  </p>

                  {data.weather_intelligence && (
                    <div className="mt-3 space-y-1.5 border-t border-primary-100 pt-2 text-xs">
                      <div className="flex items-center justify-between text-primary-700">
                        <span className="text-primary-500">Spraying condition:</span>
                        <span className="font-semibold">{data.weather_intelligence.spraying_condition}</span>
                      </div>
                      <div className="flex items-center justify-between text-primary-700">
                        <span className="text-primary-500">Disease risk:</span>
                        <span className="font-semibold text-amber-700">{data.weather_intelligence.disease_risk}</span>
                      </div>
                    </div>
                  )}

                  <Link href="/weather" className="mt-3 inline-block text-xs font-bold text-sky-700 hover:underline">
                    View full weather advisory →
                  </Link>
                </>
              ) : (
                <p className="mt-2 text-xs text-primary-500">
                  {data.weather?.message || "Weather information is temporarily unavailable."}
                </p>
              )}
            </div>

            {/* Irrigation Card */}
            <div className="card">
              <div className="flex items-center gap-2 text-primary-500">
                <Droplets className="h-4 w-4 text-sky-500" />
                <span className="text-xs font-semibold uppercase tracking-wider">Irrigation</span>
              </div>
              {data.irrigation?.days_until_next !== null && data.irrigation?.days_until_next !== undefined ? (
                <p className="mt-2.5 text-2xl font-bold text-primary-950">
                  {data.irrigation.days_until_next <= 0 ? "Due now" : `In ${data.irrigation.days_until_next} days`}
                </p>
              ) : (
                <p className="mt-2 text-sm text-primary-500">No irrigation logged yet for active crop.</p>
              )}
              <p className="mt-1 text-xs text-primary-500">{data.irrigation?.note}</p>
              <Link href={data.active_crop ? `/crops/${data.active_crop.crop_cycle_id}` : "/farms"} className="mt-3 inline-block text-xs font-bold text-sky-700 hover:underline">
                Log or view irrigation →
              </Link>
            </div>

            {/* Season Expenses Summary */}
            <div className="card">
              <div className="flex items-center gap-2 text-primary-500">
                <Wallet className="h-4 w-4 text-emerald-500" />
                <span className="text-xs font-semibold uppercase tracking-wider">Season Expenses</span>
              </div>
              <p className="mt-2.5 text-2xl font-bold text-primary-950">
                {formatCurrencyINR(data.expenses?.total ?? 0)}
              </p>
              <p className="mt-1 text-xs text-primary-500">
                {Object.keys(data.expenses?.by_category || {}).length} expense categories recorded
              </p>
              <Link href="/analytics" className="mt-3 inline-block text-xs font-bold text-primary-700 hover:underline">
                View financial analytics →
              </Link>
            </div>

            {/* Crop Doctor Recent Inspections */}
            <div className="card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary-500">
                  <Stethoscope className="h-4 w-4 text-rose-500" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Crop Health</span>
                </div>
                <Link href="/crop-doctor" className="text-xs font-bold text-rose-700 hover:underline">
                  Diagnose →
                </Link>
              </div>

              {data.recent_inspections && data.recent_inspections.length > 0 ? (
                <div className="mt-2.5 space-y-2">
                  {data.recent_inspections.map((ins) => (
                    <div
                      key={ins.id}
                      className="flex items-center justify-between rounded-lg bg-primary-50/50 p-2 text-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-semibold text-primary-900 truncate">{ins.possible_condition}</p>
                        <p className="text-[10px] text-primary-500">{formatDate(ins.date)}</p>
                      </div>
                      <Badge
                        variant={
                          ins.severity === "high"
                            ? "danger"
                            : ins.severity === "medium"
                            ? "warning"
                            : "success"
                        }
                      >
                        {ins.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs text-primary-500">
                  No health inspections recorded yet for this crop. Run Crop Doctor if you spot discoloration or pests.
                </p>
              )}
            </div>

            {/* Today's Tasks */}
            <div className="card sm:col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary-500">
                  <CheckSquare className="h-4 w-4 text-primary-600" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Today's Tasks</span>
                </div>
                {data.active_crop && (
                  <Link href={`/crops/${data.active_crop.crop_cycle_id}`} className="text-xs text-primary-600 font-semibold hover:underline">
                    View All →
                  </Link>
                )}
              </div>

              {data.todays_tasks.length === 0 ? (
                <p className="mt-2 text-xs text-primary-500">No pending tasks scheduled for today.</p>
              ) : (
                <ul className="mt-2.5 space-y-1.5">
                  {data.todays_tasks.map((t) => (
                    <li key={t.id} className="flex items-center justify-between rounded-lg bg-primary-50/50 p-2 text-xs text-primary-900">
                      <span className="font-medium truncate pr-2">{t.title}</span>
                      <Badge variant="default">{t.task_type}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Saved Crop Plans Card */}
            {data.saved_plans_count !== undefined && data.saved_plans_count > 0 && (
              <div className="card bg-sky-50/60 border-sky-200">
                <div className="flex items-center gap-2 text-sky-800">
                  <Compass className="h-4 w-4 text-sky-600" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Crop Planner</span>
                </div>
                <p className="mt-2 text-lg font-bold text-sky-950">
                  {data.saved_plans_count} Saved Plan{data.saved_plans_count > 1 ? "s" : ""}
                </p>
                <p className="mt-1 text-xs text-sky-800">
                  Convert a saved crop plan into an active crop when you begin sowing.
                </p>
                <Link href="/crop-planner" className="mt-2.5 inline-block text-xs font-bold text-sky-700 hover:underline">
                  Open Planner →
                </Link>
              </div>
            )}

            {/* Alerts */}
            {data.alerts && data.alerts.length > 0 && (
              <div className="card sm:col-span-2">
                <div className="flex items-center gap-2 text-primary-500">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Farm Advisories & Alerts</span>
                </div>
                <div className="mt-2.5 space-y-2">
                  {data.alerts.map((a, i) => (
                    <div key={i} className="rounded-xl bg-amber-50/80 border border-amber-200 p-2.5 text-xs text-amber-900">
                      <p className="font-bold">{a.title}</p>
                      <p className="mt-0.5 text-amber-800">{a.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
