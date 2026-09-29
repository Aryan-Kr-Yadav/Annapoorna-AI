"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useApi } from "@/lib/api-client";
import { useFarms } from "@/lib/farm-context";
import { FarmSelector } from "@/components/layout/FarmSelector";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Badge } from "@/components/ui/Badge";
import { formatCurrencyINR } from "@/lib/utils";
import {
  Calendar,
  CloudSun,
  Droplets,
  Sprout,
  CheckSquare,
  AlertTriangle,
  Wallet,
  DollarSign,
  Compass,
  Wind,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
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
  const { selectedFarm, farms, loading: farmsLoading } = useFarms();
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

    // Synchronize updates precisely with the start of each new minute
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

  function load() {
    if (!selectedFarm) return;
    setLoading(true);
    setError(null);
    api
      .get<DashboardData>(`/dashboard/${selectedFarm.id}`)
      .then(setData)
      .catch((e) => setError(e.message || "Could not load your dashboard."))
      .finally(() => setLoading(false));
  }

  useEffect(load, [selectedFarm?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (farmsLoading) return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>;

  if (farms.length === 0) {
    return (
      <EmptyState
        icon={Sprout}
        title="Let's set up your first farm"
        description="Add your farm and current crop to see your personalized dashboard."
        action={<Link href="/onboarding" className="btn-primary">Set up farm</Link>}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-primary-900">
            {mounted ? greetingDisplay : "Good Morning"}
          </h1>

          {mounted && now && (
            <p className="text-xs font-medium text-primary-500">
              {formatDateTime(now)}
            </p>
          )}

          <p className="text-sm text-primary-600">
            Here&apos;s what&apos;s happening on your farm today.
          </p>

          {data?.active_crop && (
            <p className="text-xs font-medium text-primary-700">
              {selectedFarm?.name?.toUpperCase()} • {data.active_crop.crop_name.toUpperCase()} — Day {data.active_crop.day_number} • {data.active_crop.current_stage}
            </p>
          )}
        </div>
        <FarmSelector />
      </div>

      {loading && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>}
      {error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && data && (
        <>
          {/* Unsold Harvest Banner */}
          {data.unsold_harvests && data.unsold_harvests.length > 0 && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-emerald-100 p-2 text-emerald-700">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-emerald-950">
                    Harvest Ready for Sale!
                  </h3>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    You have {data.unsold_harvests.map(h => `${h.remaining_quantity} ${h.unit} of ${h.crop_name}`).join(", ")} available in inventory.
                  </p>
                </div>
              </div>
              <Link
                href={`/crops/${data.unsold_harvests[0].crop_cycle_id}`}
                className="btn-primary text-xs py-1.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white shrink-0 flex items-center gap-1"
              >
                Record Crop Sale <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}

          {!data.active_crop && (
            <EmptyState
              title="No active crop yet"
              description="Add a crop cycle or select a saved crop plan to start tracking your farm."
              action={<Link href={`/farms/${selectedFarm?.id}`} className="btn-primary">Add a crop</Link>}
            />
          )}

          {data.active_crop && (
            <div className="card">
              <p className="text-sm font-medium text-primary-500">{data.active_crop.season}</p>
              <p className="mt-1 text-lg font-semibold text-primary-900">{data.active_crop.crop_name}</p>
              {data.active_crop.progress_percentage !== null && (
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-primary-100">
                  <div className="h-full rounded-full bg-primary-600" style={{ width: `${data.active_crop.progress_percentage}%` }} />
                </div>
              )}
              <p className="mt-1 text-xs text-primary-500">{data.active_crop.progress_percentage ?? "—"}% through estimated lifecycle</p>
              <Link href={`/crops/${data.active_crop.crop_cycle_id}`} className="mt-3 inline-block text-sm font-medium text-primary-700 underline">
                View crop details →
              </Link>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Weather Intelligence Card */}
            <div className="card">
              <div className="flex items-center gap-2 text-primary-500">
                <CloudSun className="h-4 w-4 text-sky-500" />
                <span className="text-xs font-medium uppercase">Weather Intelligence</span>
              </div>
              {data.weather?.available ? (
                <>
                  <div className="mt-2 flex items-baseline justify-between">
                    <p className="text-2xl font-semibold text-primary-900">{Math.round(data.weather.current?.temperature_c)}°C</p>
                    {data.weather_intelligence && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-primary-100 text-primary-800">
                        Score: {data.weather_intelligence.farming_condition_score}/100
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-primary-600 capitalize">{data.weather.current?.condition}</p>

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

                  <Link href="/weather" className="mt-3 inline-block text-xs font-medium text-sky-700 hover:underline">
                    View full weather advisory →
                  </Link>
                </>
              ) : (
                <p className="mt-2 text-sm text-primary-500">{data.weather?.message || "Weather information is temporarily unavailable."}</p>
              )}
            </div>

            {/* Irrigation Card */}
            <div className="card">
              <div className="flex items-center gap-2 text-primary-500"><Droplets className="h-4 w-4 text-sky-500" /><span className="text-xs font-medium uppercase">Irrigation</span></div>
              {data.irrigation?.days_until_next !== null && data.irrigation?.days_until_next !== undefined ? (
                <p className="mt-2 text-2xl font-semibold text-primary-900">
                  {data.irrigation.days_until_next <= 0 ? "Due now" : `In ${data.irrigation.days_until_next}d`}
                </p>
              ) : (
                <p className="mt-2 text-sm text-primary-500">No irrigation logged yet.</p>
              )}
              <p className="mt-1 text-xs text-primary-500">{data.irrigation?.note}</p>
            </div>

            {/* Expenses Summary */}
            <div className="card">
              <div className="flex items-center gap-2 text-primary-500"><Wallet className="h-4 w-4 text-emerald-500" /><span className="text-xs font-medium uppercase">Season Expenses</span></div>
              <p className="mt-2 text-2xl font-semibold text-primary-900">{formatCurrencyINR(data.expenses?.total ?? 0)}</p>
              <p className="mt-1 text-xs text-primary-500">{Object.keys(data.expenses?.by_category || {}).length} categories logged</p>
              <Link href="/analytics" className="mt-3 inline-block text-xs font-medium text-primary-700 hover:underline">
                View financial analytics →
              </Link>
            </div>

            {/* Saved Crop Plans Notification Card */}
            {data.saved_plans_count !== undefined && data.saved_plans_count > 0 && (
              <div className="card bg-sky-50/50 border-sky-200">
                <div className="flex items-center gap-2 text-sky-800">
                  <Compass className="h-4 w-4 text-sky-600" />
                  <span className="text-xs font-medium uppercase">Crop Planner</span>
                </div>
                <p className="mt-2 text-xl font-bold text-sky-950">
                  {data.saved_plans_count} Saved Plan{data.saved_plans_count > 1 ? "s" : ""} Ready
                </p>
                <p className="mt-1 text-xs text-sky-800">
                  You have saved crop plans for this farm. Convert a plan into an active crop when ready to sow.
                </p>
                <Link href="/crop-planner" className="mt-3 inline-block text-xs font-bold text-sky-700 hover:underline">
                  Go to Crop Planner →
                </Link>
              </div>
            )}

            {/* Today's Tasks */}
            <div className="card sm:col-span-2">
              <div className="flex items-center gap-2 text-primary-500"><CheckSquare className="h-4 w-4 text-primary-600" /><span className="text-xs font-medium uppercase">Today's Tasks</span></div>
              {data.todays_tasks.length === 0 ? (
                <p className="mt-2 text-sm text-primary-500">No tasks scheduled for today.</p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {data.todays_tasks.map((t) => (
                    <li key={t.id} className="flex items-center gap-2 text-sm text-primary-800">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary-500" /> {t.title}
                      <Badge variant="default" className="ml-auto">{t.task_type}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Alerts */}
            <div className="card">
              <div className="flex items-center gap-2 text-primary-500"><AlertTriangle className="h-4 w-4 text-amber-500" /><span className="text-xs font-medium uppercase">Alerts</span></div>
              {data.alerts.length === 0 ? (
                <p className="mt-2 text-sm text-primary-500">No active alerts.</p>
              ) : (
                <div className="mt-2 space-y-2">
                  {data.alerts.map((a, i) => (
                    <div key={i} className="rounded-lg bg-amber-50 p-2 text-xs text-amber-800">
                      <p className="font-medium">{a.title}</p>
                      <p>{a.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
