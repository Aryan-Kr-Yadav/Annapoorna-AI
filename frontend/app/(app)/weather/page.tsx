"use client";

import { useEffect, useState } from "react";
import { useFarms } from "@/lib/farm-context";
import { useApi } from "@/lib/api-client";
import { FarmSelector } from "@/components/layout/FarmSelector";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { Badge } from "@/components/ui/Badge";
import { CloudSun, Droplets, Wind, ShieldAlert, Thermometer, Calendar, Clock } from "lucide-react";

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

  const intel = weather?.weather_intelligence || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-primary-900">Weather Intelligence</h1>
          <p className="text-xs text-primary-600">Weather-driven agricultural decision support for {selectedFarm?.name || "your farm"}</p>
        </div>
        <FarmSelector />
      </div>

      {loading && <CardSkeleton />}
      {error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && weather && (
        weather.available ? (
          <div className="space-y-6">
            {/* Current Conditions & Farming Condition Score Banner */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="card md:col-span-2 flex flex-col justify-between space-y-4 bg-gradient-to-br from-white to-primary-50">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-primary-500">Current Farm Conditions</span>
                    <p className="mt-1 text-4xl font-bold text-primary-900">{Math.round(weather.current.temperature_c)}°C</p>
                    <p className="text-sm font-medium text-primary-700 capitalize">{weather.current.condition}</p>
                  </div>
                  <CloudSun className="h-12 w-12 text-primary-600" strokeWidth={1.5} />
                </div>
                <div className="grid grid-cols-3 gap-2 border-t border-primary-100 pt-3 text-xs">
                  <div>
                    <span className="text-primary-500 flex items-center gap-1"><Droplets className="h-3.5 w-3.5 text-blue-500" /> Humidity</span>
                    <p className="font-semibold text-primary-900">{weather.current.humidity_percent}%</p>
                  </div>
                  <div>
                    <span className="text-primary-500 flex items-center gap-1"><Wind className="h-3.5 w-3.5 text-teal-500" /> Wind Speed</span>
                    <p className="font-semibold text-primary-900">{weather.current.wind_speed_kmh || 0} km/h</p>
                  </div>
                  <div>
                    <span className="text-primary-500 flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-indigo-500" /> Best Window</span>
                    <p className="font-semibold text-primary-900">6–10 AM</p>
                  </div>
                </div>
              </div>

              {/* Farming Condition Assessment */}
              <div className="card flex flex-col justify-between space-y-3 border-l-4 border-l-primary-600">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-primary-500 uppercase">Farming Conditions</span>
                  <Badge variant={intel.farming_condition_score === "CAUTION" ? "danger" : intel.farming_condition_score === "MODERATE" ? "warning" : "success"}>
                    {intel.farming_condition_score || "GOOD"}
                  </Badge>
                </div>
                <p className="text-xs text-primary-700">{intel.score_description || "Favorable conditions for routine operations."}</p>
                <div className="rounded-lg bg-primary-50 p-2.5 text-xs text-primary-800">
                  <span className="font-semibold">Field Window:</span> {intel.best_farming_window || "Early morning recommended"}
                </div>
              </div>
            </div>

            {/* Decision Intelligence Cards Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Rain & Irrigation Advisory */}
              <div className="card space-y-2 border-t-2 border-t-blue-500">
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-semibold text-primary-900">Irrigation Advisory</h3>
                </div>
                <p className="text-xs text-primary-700">{intel.rain_advisory || "Dry weather expected. Maintain normal irrigation schedule."}</p>
              </div>

              {/* Disease Risk Signal */}
              <div className="card space-y-2 border-t-2 border-t-amber-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-amber-600" />
                    <h3 className="text-sm font-semibold text-primary-900">Disease Risk Signal</h3>
                  </div>
                  <Badge variant={intel.disease_risk === "HIGH" ? "danger" : intel.disease_risk === "MODERATE" ? "warning" : "success"}>
                    {intel.disease_risk || "LOW"}
                  </Badge>
                </div>
                <p className="text-xs text-primary-700">{intel.disease_description || "Low foliar disease risk today."}</p>
              </div>

              {/* Spraying Conditions */}
              <div className="card space-y-2 border-t-2 border-t-emerald-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wind className="h-4 w-4 text-emerald-600" />
                    <h3 className="text-sm font-semibold text-primary-900">Spraying Window</h3>
                  </div>
                  <Badge variant={intel.spraying_condition === "AVOID" ? "danger" : intel.spraying_condition === "CAUTION" ? "warning" : "success"}>
                    {intel.spraying_condition || "GOOD"}
                  </Badge>
                </div>
                <p className="text-xs text-primary-700">{intel.spraying_description || "Low wind speed and clear skies."}</p>
              </div>
            </div>

            {/* Stress Warning if Present */}
            {intel.stress_warning && (
              <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
                <Thermometer className="h-5 w-5 shrink-0 text-amber-700" />
                <p className="font-medium">{intel.stress_warning}</p>
              </div>
            )}

            {/* 7-Day Forecast Timeline */}
            <div>
              <h2 className="text-base font-semibold text-primary-900 mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary-600" /> 7-Day Weather Forecast
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-7">
                {weather.daily_forecast.map((d: any) => (
                  <div key={d.date} className="card text-center space-y-1 hover:border-primary-300">
                    <p className="text-xs font-semibold text-primary-600">
                      {new Date(d.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric" })}
                    </p>
                    <p className="text-sm font-bold text-primary-900">{Math.round(d.temp_max_c)}° <span className="text-xs font-normal text-primary-500">/ {Math.round(d.temp_min_c)}°</span></p>
                    <p className="text-xs text-blue-600 font-medium">{d.rain_probability_percent}% rain</p>
                    <p className="text-[11px] text-primary-500 truncate" title={d.condition}>{d.condition}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <ErrorState message={weather.message} onRetry={load} />
        )
      )}
    </div>
  );
}
