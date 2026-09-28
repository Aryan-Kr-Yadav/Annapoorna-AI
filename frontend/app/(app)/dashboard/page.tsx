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
import { Calendar, CloudSun, Droplets, Sprout, CheckSquare, AlertTriangle, Wallet } from "lucide-react";
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
          {!data.active_crop && (
            <EmptyState
              title="No active crop yet"
              description="Add a crop cycle to this farm to start tracking its lifecycle, tasks and health."
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
            <div className="card">
              <div className="flex items-center gap-2 text-primary-500"><CloudSun className="h-4 w-4" /><span className="text-xs font-medium uppercase">Weather</span></div>
              {data.weather?.available ? (
                <>
                  <p className="mt-2 text-2xl font-semibold text-primary-900">{Math.round(data.weather.current?.temperature_c)}°C</p>
                  <p className="text-sm text-primary-600 capitalize">{data.weather.current?.condition}</p>
                  {data.weather.daily_forecast?.[1] && (
                    <p className="mt-1 text-xs text-primary-500">
                      Tomorrow: {data.weather.daily_forecast[1].rain_probability_percent}% chance of rain
                    </p>
                  )}
                </>
              ) : (
                <p className="mt-2 text-sm text-primary-500">{data.weather?.message || "Weather information is temporarily unavailable."}</p>
              )}
            </div>

            <div className="card">
              <div className="flex items-center gap-2 text-primary-500"><Droplets className="h-4 w-4" /><span className="text-xs font-medium uppercase">Irrigation</span></div>
              {data.irrigation?.days_until_next !== null && data.irrigation?.days_until_next !== undefined ? (
                <p className="mt-2 text-2xl font-semibold text-primary-900">
                  {data.irrigation.days_until_next <= 0 ? "Due now" : `In ${data.irrigation.days_until_next}d`}
                </p>
              ) : (
                <p className="mt-2 text-sm text-primary-500">No irrigation logged yet.</p>
              )}
              <p className="mt-1 text-xs text-primary-500">{data.irrigation?.note}</p>
            </div>

            <div className="card">
              <div className="flex items-center gap-2 text-primary-500"><Wallet className="h-4 w-4" /><span className="text-xs font-medium uppercase">Season Expenses</span></div>
              <p className="mt-2 text-2xl font-semibold text-primary-900">{formatCurrencyINR(data.expenses?.total ?? 0)}</p>
              <p className="mt-1 text-xs text-primary-500">{Object.keys(data.expenses?.by_category || {}).length} categories logged</p>
            </div>

            <div className="card sm:col-span-2">
              <div className="flex items-center gap-2 text-primary-500"><CheckSquare className="h-4 w-4" /><span className="text-xs font-medium uppercase">Today's Tasks</span></div>
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

            <div className="card">
              <div className="flex items-center gap-2 text-primary-500"><AlertTriangle className="h-4 w-4" /><span className="text-xs font-medium uppercase">Alerts</span></div>
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
