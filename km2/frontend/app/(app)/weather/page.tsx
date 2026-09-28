"use client";

import { useEffect, useState } from "react";
import { useFarms } from "@/lib/farm-context";
import { useApi } from "@/lib/api-client";
import { FarmSelector } from "@/components/layout/FarmSelector";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";

export default function WeatherPage() {
  const api = useApi();
  const { selectedFarm } = useFarms();
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load() {
    if (!selectedFarm) return;
    setLoading(true);
    setError(null);
    api.get<any>(`/farms/${selectedFarm.id}/weather`).then(setWeather).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }
  useEffect(load, [selectedFarm?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-primary-900">Weather</h1>
        <FarmSelector />
      </div>

      {loading && <CardSkeleton />}
      {error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && weather && (
        weather.available ? (
          <div className="space-y-4">
            <div className="card">
              <p className="text-4xl font-semibold text-primary-900">{Math.round(weather.current.temperature_c)}°C</p>
              <p className="text-primary-600 capitalize">{weather.current.condition}</p>
              <p className="mt-2 text-sm text-primary-500">Humidity: {weather.current.humidity_percent}% • Wind: {weather.current.wind_speed_ms} m/s</p>
            </div>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-7">
              {weather.daily_forecast.map((d: any) => (
                <div key={d.date} className="card text-center">
                  <p className="text-xs text-primary-500">{new Date(d.date).toLocaleDateString("en-IN", { weekday: "short" })}</p>
                  <p className="mt-1 text-sm font-medium text-primary-900">{Math.round(d.temp_max_c)}° / {Math.round(d.temp_min_c)}°</p>
                  <p className="mt-1 text-xs text-primary-500">{d.rain_probability_percent}% rain</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <ErrorState message={weather.message} onRetry={load} />
        )
      )}
    </div>
  );
}
