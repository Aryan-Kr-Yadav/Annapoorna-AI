import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Search,
  Filter,
  DollarSign,
  ArrowUpDown,
  Building2,
  Calendar,
  Sparkles,
  Info,
} from "lucide-react";
import { useFarms } from "../contexts/FarmContext";
import { useTranslation } from "../contexts/LanguageContext";
import marketApi from "../api/market";
import PageHeader from "../components/common/PageHeader";
import Badge from "../components/common/Badge";
import EmptyState from "../components/common/EmptyState";
import Skeleton from "../components/common/Skeleton";
import { formatCurrencyINR, formatDate } from "../utils/formatters";

export default function Market() {
  const { t } = useTranslation();
  const { selectedFarm, selectedCrop } = useFarms();

  const [cropQuery, setCropQuery] = useState(selectedCrop?.crop_name || "Wheat");
  const [stateQuery, setStateQuery] = useState(selectedFarm?.state || "Uttar Pradesh");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const searchPrices = async (targetCrop = cropQuery, targetState = stateQuery) => {
    if (!targetCrop.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await marketApi.getPrices(targetCrop.trim(), targetState?.trim() || "");
      setResult(data);
    } catch (err) {
      setError(err?.message || "Failed to retrieve market prices from AGMARKNET.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCrop?.crop_name) {
      setCropQuery(selectedCrop.crop_name);
    }
    if (selectedFarm?.state) {
      setStateQuery(selectedFarm.state);
    }
    searchPrices(selectedCrop?.crop_name || cropQuery, selectedFarm?.state || stateQuery);
  }, [selectedCrop?.crop_name, selectedFarm?.state]);

  const points = result?.points || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("market.title", "Mandi & Commodity Market Intelligence")}
        subtitle="Wholesale market arrivals, modal rates, and price trends verified from APMC / AGMARKNET."
      />

      {/* Search & Filter Header */}
      <div className="card space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            searchPrices();
          }}
          className="grid gap-3 sm:grid-cols-12"
        >
          <div className="sm:col-span-6">
            <label className="label">Commodity / Crop</label>
            <div className="relative">
              <input
                type="text"
                value={cropQuery}
                onChange={(e) => setCropQuery(e.target.value)}
                placeholder="e.g. Wheat, Mustard, Paddy, Potato..."
                className="input pl-9 text-xs sm:text-sm"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            </div>
          </div>

          <div className="sm:col-span-4">
            <label className="label">State / Region</label>
            <input
              type="text"
              value={stateQuery}
              onChange={(e) => setStateQuery(e.target.value)}
              placeholder="e.g. Uttar Pradesh, Punjab, Haryana..."
              className="input text-xs sm:text-sm"
            />
          </div>

          <div className="flex items-end sm:col-span-2">
            <button
              type="submit"
              disabled={loading || !cropQuery.trim()}
              className="btn-primary w-full"
            >
              {loading ? "Searching..." : "Search Mandis"}
            </button>
          </div>
        </form>

        {/* Quick popular crops */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="text-slate-400">Popular:</span>
          {["Wheat", "Mustard", "Paddy (Dhan)", "Potato", "Cotton", "Soybean", "Maize"].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setCropQuery(c);
                searchPrices(c, stateQuery);
              }}
              className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700 transition hover:bg-primary-100 hover:text-primary-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-primary-950/40"
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      {!loading && result && (
        <>
          {!result.data_available ? (
            <EmptyState
              icon={TrendingUp}
              title="No recent APMC price quotes found"
              description={result.message || `No mandi arrival records found for "${cropQuery}" in ${stateQuery}.`}
            />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    APMC Mandi Quotations for {result.crop || cropQuery}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    State: {result.state || stateQuery} • Total {points.length} Mandi reports
                  </p>
                </div>
              </div>

              {/* Mandi Cards / Table */}
              <div className="card p-0 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Mandi / Market</th>
                      <th className="px-4 py-3 font-semibold">District</th>
                      <th className="px-4 py-3 font-semibold">Modal Price</th>
                      <th className="px-4 py-3 font-semibold">Price Range (Min - Max)</th>
                      <th className="px-4 py-3 font-semibold">Reporting Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {points.map((p, idx) => (
                      <tr key={idx} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-3.5 w-3.5 text-primary-600" />
                            <span>{p.market_name || "Regional APMC"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          {p.district || "—"}
                        </td>
                        <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrencyINR(p.modal_price)} / {p.unit || "Quintal"}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                          {p.min_price ? formatCurrencyINR(p.min_price) : "—"} – {p.max_price ? formatCurrencyINR(p.max_price) : "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {p.price_date ? formatDate(p.price_date) : "Recent"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {points.length > 0 && points[0].fetched_at && (
                <p className="text-right text-[11px] text-slate-400">
                  Last updated from government portal: {formatDate(points[0].fetched_at)}
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
