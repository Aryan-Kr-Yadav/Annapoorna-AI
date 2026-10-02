import React, { useState, useEffect, useCallback } from "react";
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
  AlertTriangle,
  Sun,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { useFarms } from "../contexts/FarmContext";
import { useTranslation } from "../contexts/LanguageContext";
import farmsApi from "../api/farms";
import PageHeader from "../components/common/PageHeader";
import Badge from "../components/common/Badge";
import Skeleton from "../components/common/Skeleton";
import ErrorState from "../components/common/ErrorState";
import WeatherConditionBadge from "../components/weather/WeatherConditionBadge";
import WeatherTimeline from "../components/weather/WeatherTimeline";
import { clampScore, getScoreLabel, calculateFarmingConditionScore } from "../utils/scoring";

export default function Weather() {
  const { t } = useTranslation();
  const { selectedFarm, selectFarm, farms, selectedCrop } = useFarms();

  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadWeather = useCallback(async () => {
    if (!selectedFarm?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await farmsApi.getWeather(selectedFarm.id);
      setWeather(data);
    } catch (err) {
      setError(err?.message || "Failed to load farm weather telemetry.");
    } finally {
      setLoading(false);
    }
  }, [selectedFarm?.id]);

  useEffect(() => {
    loadWeather();
  }, [loadWeather]);

  const intel = weather?.weather_intelligence || {};

  if (!selectedFarm) {
    return (
      <div className="card p-8 text-center space-y-3">
        <Tractor className="mx-auto h-10 w-10 text-slate-400" />
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Select a Farm</h3>
        <p className="text-xs text-slate-500">
          Please select or register a farm to view micro-climate intelligence and agricultural spray advisories.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header with Farm Location & Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <PageHeader
            title={t("weather.title", "Weather & Micro-Climate Intelligence")}
            subtitle={`Telemetry & 7-day agronomic forecast for ${selectedFarm.name} (${selectedFarm.district || ""}, ${selectedFarm.state || ""})`}
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Farm:</span>
          <select
            value={selectedFarm.id}
            onChange={(e) => selectFarm(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none dark:border-[#1e3627] dark:bg-[#121c15] dark:text-stone-100"
          >
            {farms.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.district})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {error && <ErrorState message={error} onRetry={loadWeather} />}

      {!loading && !error && weather && (
        <>
          {/* Main Top Banner: Current Conditions & Farming Score */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Current Conditions Card */}
            <div className="card md:col-span-2 flex flex-col justify-between space-y-4 bg-gradient-to-br from-white to-primary-50/50 dark:from-slate-900 dark:to-primary-950/20">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary-700 dark:text-primary-300">
                    Live Farm Atmosphere
                  </span>
                  <div className="mt-1 flex items-baseline gap-3">
                    <span className="text-4xl font-extrabold text-slate-900 dark:text-white">
                      {Math.round(weather.current?.temperature_c || 0)}°C
                    </span>
                    <WeatherConditionBadge condition={weather.current?.condition} />
                  </div>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                    Feels like {Math.round(weather.current?.apparent_temperature_c || weather.current?.temperature_c || 0)}°C
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">Relative Humidity</span>
                  <span className="text-xl font-bold text-slate-900 dark:text-white">
                    {weather.current?.humidity || 0}%
                  </span>
                </div>
              </div>

              {/* Sub-metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">Wind Velocity</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {weather.current?.wind_kph || 0} km/h
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">Precipitation Today</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {weather.current?.precipitation_mm || 0} mm
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">Day Range (Min/Max)</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {Math.round(weather.forecast?.[0]?.min_temp_c || 0)}° / {Math.round(weather.forecast?.[0]?.max_temp_c || 0)}°
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">Rain Probability</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {weather.forecast?.[0]?.rain_probability || 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* Farming Condition Index Composite */}
            {(() => {
              const rawScore = intel.farming_condition_score;
              const parsedScore = clampScore(rawScore);
              const effectiveScore = parsedScore !== null
                ? parsedScore
                : calculateFarmingConditionScore(weather);
              const effectiveLabel = intel.farming_condition_label || (effectiveScore !== null ? getScoreLabel(effectiveScore) : (typeof rawScore === "string" ? rawScore : "Good"));

              return (
                <div className="card flex flex-col justify-between space-y-4 bg-gradient-to-br from-primary-800 to-emerald-900 text-white shadow-md border-emerald-700/50">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                      {t("weather.operationsScore", "Farming Operations Score")}
                    </span>

                    {effectiveScore !== null ? (
                      <div className="mt-2 space-y-1">
                        <div className="flex items-baseline gap-2.5">
                          <span className="text-4xl font-black text-white">{effectiveScore}</span>
                          <span className="text-emerald-200 font-semibold text-sm">/ 100</span>
                          {effectiveLabel && (
                            <span className="ml-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-xs">
                              {effectiveLabel}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2">
                        <span className="px-3 py-1 rounded-full text-sm font-bold bg-white/20 text-white backdrop-blur-xs">
                          {effectiveLabel || "Good"}
                        </span>
                      </div>
                    )}

                    <p className="mt-2 text-xs text-emerald-100/90 leading-relaxed">
                      Composite index factoring chemical drift, precipitation risk, and evapotranspiration.
                    </p>
                  </div>

                  <div className="rounded-xl bg-white/10 p-3 backdrop-blur-xs text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-emerald-100">Best Fieldwork Window:</span>
                      <span className="font-bold text-white">{intel.best_farming_window || "Early Morning (6 AM - 9 AM)"}</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Agronomic Advisories: Spraying, Rain, Disease Risk */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card space-y-2">
              <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
                <Wind className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Spraying Advisory</span>
              </div>
              <p className="text-base font-bold text-slate-900 dark:text-white">
                {intel.spraying_condition || "Favorable for Spraying"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Wind speeds are under threshold; minimal pesticide drift risk during early hours.
              </p>
            </div>

            <div className="card space-y-2">
              <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
                <Droplets className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Rain & Irrigation</span>
              </div>
              <p className="text-base font-bold text-slate-900 dark:text-white">
                {intel.rain_advisory || "Normal Watering Routine"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Rainfall probability is moderate; check rootzone soil dampness before flood/drip irrigation.
              </p>
            </div>

            <div className="card space-y-2">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <ShieldAlert className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Disease-Risk Signal</span>
              </div>
              <p className="text-base font-bold text-amber-800 dark:text-amber-300">
                {intel.disease_risk || "Low Fungal Risk"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sustained warm humidity can stimulate leaf rust or blight in dense crop foliage.
              </p>
            </div>
          </div>

          {/* 7-Day Agronomic Forecast Timeline */}
          {weather.forecast && weather.forecast.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  7-Day Agricultural Forecast & Trends
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Data sourced from Open-Meteo High-Resolution Model
                </span>
              </div>
              <WeatherTimeline forecast={weather.forecast} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
