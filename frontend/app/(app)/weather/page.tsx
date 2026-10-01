"use client";

import { useEffect, useState, useCallback } from "react";
import { useFarms } from "@/lib/farm-context";
import { useApi } from "@/lib/api-client";
import { FarmSelector } from "@/components/layout/FarmSelector";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { Badge } from "@/components/ui/Badge";
import {
  CloudSun,
  Droplets,
  Wind,
  ShieldAlert,
  Thermometer,
  Calendar,
  Clock,
  Sprout,
  Tractor,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export default function WeatherPage() {
  const api = useApi();
  const { t } = useTranslation();
  const { selectedFarm, selectedCrop } = useFarms();
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!selectedFarm) return;
    setLoading(true);
    setError(null);
    api
      .get<any>(`/farms/${selectedFarm.id}/weather`)
      .then(setWeather)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [api, selectedFarm?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const intel = weather?.weather_intelligence || {};

  return (
    <div className="space-y-6">
      {/* Header with Farm Location & Crop Advisory Context */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-primary-100 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary-950">
            {t("weather.title")}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs sm:text-sm text-primary-600">
            <span className="flex items-center gap-1 font-semibold text-primary-800">
              <Tractor className="h-3.5 w-3.5 text-primary-600" />
              Weather for: {selectedFarm?.name || "Your Farm"} ({selectedFarm?.district}, {selectedFarm?.state})
            </span>
            {selectedCrop && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1 font-semibold text-emerald-800">
                  <Sprout className="h-3.5 w-3.5 text-emerald-600" />
                  Crop Advisory: {selectedCrop.crop_name} ({selectedCrop.season})
                </span>
              </>
            )}
          </div>
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
                    <span className="text-xs font-semibold uppercase tracking-wider text-primary-500">
                      Current Farm Conditions
                    </span>
                    <h2 className="text-3xl font-bold text-primary-900 mt-1">
                      {Math.round(weather.current?.temperature_c)}°C
                    </h2>
                    <p className="text-sm font-medium text-primary-700 capitalize mt-0.5">
                      {weather.current?.condition}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-primary-500 block">Humidity</span>
                    <span className="text-lg font-bold text-primary-800">{weather.current?.humidity}%</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-primary-100 text-xs">
                  <div>
                    <span className="text-primary-500 block">Wind Speed</span>
                    <span className="font-semibold text-primary-800">{weather.current?.wind_kph} km/h</span>
                  </div>
                  <div>
                    <span className="text-primary-500 block">Rainfall Today</span>
                    <span className="font-semibold text-primary-800">{weather.current?.precipitation_mm || 0} mm</span>
                  </div>
                  <div>
                    <span className="text-primary-500 block">Min / Max</span>
                    <span className="font-semibold text-primary-800">
                      {Math.round(weather.forecast?.[0]?.min_temp_c || 0)}° / {Math.round(weather.forecast?.[0]?.max_temp_c || 0)}°
                    </span>
                  </div>
                  <div>
                    <span className="text-primary-500 block">Rain Probability</span>
                    <span className="font-semibold text-primary-800">{weather.forecast?.[0]?.rain_probability || 0}%</span>
                  </div>
                </div>
              </div>

              {/* Farming Condition Score */}
              <div className="card flex flex-col justify-between space-y-3 bg-gradient-to-br from-primary-600 to-emerald-700 text-white shadow-md">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                    Farming Condition Index
                  </span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold">{intel.farming_condition_score ?? 85}</span>
                    <span className="text-emerald-200 font-semibold text-sm">/ 100</span>
                  </div>
                  <p className="text-xs text-emerald-100 mt-1">
                    Composite score factoring spraying windows, rain risk, thermal stress, and evapotranspiration.
                  </p>
                </div>

                <div className="rounded-xl bg-white/10 p-2.5 backdrop-blur-xs text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-emerald-100">Best Activity Window:</span>
                    <span className="font-bold">{intel.best_farming_window || "Early Morning (6 AM - 9 AM)"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Agronomic Recommendations & Stress Warnings */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="card space-y-2">
                <div className="flex items-center gap-2 text-primary-500">
                  <Wind className="h-4 w-4 text-sky-500" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Spraying Advisory</span>
                </div>
                <p className="text-base font-bold text-primary-950">{intel.spraying_condition || "Favorable"}</p>
                <p className="text-xs text-primary-600">
                  {selectedCrop ? `For ${selectedCrop.crop_name}: ` : ""}
                  Spray early morning when wind speed is lowest to prevent chemical drift.
                </p>
              </div>

              <div className="card space-y-2">
                <div className="flex items-center gap-2 text-primary-500">
                  <Droplets className="h-4 w-4 text-sky-500" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Rain & Irrigation</span>
                </div>
                <p className="text-base font-bold text-primary-950">{intel.rain_advisory || "Normal Schedule"}</p>
                <p className="text-xs text-primary-600">
                  Check topsoil moisture before overhead irrigation if rain is forecasted.
                </p>
              </div>

              <div className="card space-y-2">
                <div className="flex items-center gap-2 text-primary-500">
                  <ShieldAlert className="h-4 w-4 text-amber-500" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Disease Risk</span>
                </div>
                <p className="text-base font-bold text-amber-800">{intel.disease_risk || "Low Risk"}</p>
                <p className="text-xs text-primary-600">
                  High humidity combined with mild temperatures can trigger fungal rust or blight. Monitor lower leaves.
                </p>
              </div>
            </div>

            {/* 5-Day Forecast */}
            {weather.forecast && weather.forecast.length > 0 && (
              <div className="card space-y-3">
                <h3 className="text-sm font-bold text-primary-950">5-Day Agricultural Forecast</h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {weather.forecast.map((f: any, idx: number) => (
                    <div key={idx} className="rounded-xl border border-primary-100 bg-primary-50/30 p-2.5 text-center text-xs space-y-1">
                      <p className="font-bold text-primary-900">{f.date || `Day ${idx + 1}`}</p>
                      <p className="text-primary-600 text-[11px] truncate">{f.condition}</p>
                      <p className="font-semibold text-primary-800">
                        {Math.round(f.min_temp_c)}° / {Math.round(f.max_temp_c)}°C
                      </p>
                      <Badge variant="default" className="text-[10px] px-1">
                        Rain: {f.rain_probability || 0}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="card p-6 text-center text-primary-500 text-sm">
            {weather.message || "Weather details for this location could not be fetched. Check coordinates in Farm settings."}
          </div>
        )
      )}
    </div>
  );
}
