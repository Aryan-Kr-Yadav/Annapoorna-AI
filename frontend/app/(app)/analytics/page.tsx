"use client";

import { useEffect, useState } from "react";
import { useFarms } from "@/lib/farm-context";
import { useApi } from "@/lib/api-client";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrencyINR, formatDate } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  PieChart,
  BarChart3,
  Calendar,
  Layers,
  Sprout,
  CheckCircle2,
  Tractor,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SeasonReport {
  crop_cycle: {
    id: string;
    crop_name: string;
    season: string;
    year: number;
    status: string;
    sowing_date: string;
    actual_harvest_date: string | null;
  };
  financials: {
    total_expenses: number;
    total_revenue: number;
    net_profit: number;
    profit_margin_pct: number;
    roi_pct: number;
  };
  expenses_by_category: Record<string, number>;
  yield: {
    total_quantity: number;
    unit: string;
  };
  sales_summary: {
    total_sold_quantity: number;
    average_price_per_unit: number;
    total_sales_count: number;
  };
}

export default function AnalyticsPage() {
  const api = useApi();
  const { selectedFarm, crops, selectedCrop, selectCrop } = useFarms();

  const [viewMode, setViewMode] = useState<"farm" | "crop">("farm");
  const [seasons, setSeasons] = useState<SeasonReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedFarm) return;
    setLoading(true);
    api
      .get<SeasonReport[]>(`/analytics/farms/${selectedFarm.id}/seasons`)
      .then(setSeasons)
      .catch(() => setSeasons([]))
      .finally(() => setLoading(false));
  }, [selectedFarm?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Filter or aggregate based on viewMode
  const displayedSeasons =
    viewMode === "crop" && selectedCrop
      ? seasons.filter((s) => s.crop_cycle.id === selectedCrop.id)
      : seasons;

  // Aggregate stats across displayed seasons
  const totalRevenue = displayedSeasons.reduce((acc, s) => acc + (s.financials?.total_revenue || 0), 0);
  const totalExpenses = displayedSeasons.reduce((acc, s) => acc + (s.financials?.total_expenses || 0), 0);
  const netProfit = totalRevenue - totalExpenses;
  const overallRoi = totalExpenses > 0 ? Math.round((netProfit / totalExpenses) * 100) : 0;

  // Aggregate expenses by category
  const categoryTotals: Record<string, number> = {};
  displayedSeasons.forEach((s) => {
    Object.entries(s.expenses_by_category || {}).forEach(([cat, amt]) => {
      categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
    });
  });

  return (
    <div className="space-y-6">
      {/* Header and View Mode Switcher */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-primary-100 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary-950">
            Farm Performance & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-primary-600 mt-1">
            Financial performance, expense distribution, and seasonal breakdown for {selectedFarm?.name || "your farm"}.
          </p>
        </div>

        {/* View Mode Toggle & Crop Picker */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl bg-primary-100/70 p-1">
            <button
              type="button"
              onClick={() => setViewMode("farm")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-bold transition",
                viewMode === "farm"
                  ? "bg-white text-primary-900 shadow-2xs"
                  : "text-primary-600 hover:text-primary-900"
              )}
            >
              Farm View (All Crops)
            </button>
            <button
              type="button"
              onClick={() => setViewMode("crop")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-bold transition",
                viewMode === "crop"
                  ? "bg-white text-primary-900 shadow-2xs"
                  : "text-primary-600 hover:text-primary-900"
              )}
            >
              Crop View
            </button>
          </div>

          {viewMode === "crop" && (
            <select
              value={selectedCrop?.id || ""}
              onChange={(e) => selectCrop(e.target.value)}
              className="rounded-xl border border-primary-200 bg-white px-3 py-1.5 text-xs font-bold text-primary-900 shadow-2xs"
            >
              {crops.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.crop_name} ({c.season} {c.year})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {loading ? (
        <CardSkeleton />
      ) : displayedSeasons.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title={viewMode === "crop" ? "No analytics for this crop cycle" : "No seasonal records found"}
          description="Log expenses, harvests, and crop sales for your crops to view financial breakdowns and seasonal ROI performance."
        />
      ) : (
        <div className="space-y-6">
          {/* Top 4 Financial KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="card">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary-500">
                {viewMode === "crop" ? "Crop Revenue" : "Total Farm Revenue"}
              </span>
              <p className="mt-2 text-2xl font-bold text-emerald-700">{formatCurrencyINR(totalRevenue)}</p>
              <p className="mt-1 text-xs text-primary-500">From verified harvest sales</p>
            </div>

            <div className="card">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary-500">
                Total Expenses
              </span>
              <p className="mt-2 text-2xl font-bold text-rose-700">{formatCurrencyINR(totalExpenses)}</p>
              <p className="mt-1 text-xs text-primary-500">Inputs, labor, irrigation, fertilizer</p>
            </div>

            <div className="card">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary-500">
                Net Profit
              </span>
              <p
                className={cn(
                  "mt-2 text-2xl font-bold",
                  netProfit >= 0 ? "text-emerald-700" : "text-red-600"
                )}
              >
                {formatCurrencyINR(netProfit)}
              </p>
              <p className="mt-1 text-xs text-primary-500">Revenue minus all logged expenses</p>
            </div>

            <div className="card">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary-500">
                Overall ROI
              </span>
              <p className="mt-2 text-2xl font-bold text-primary-900">{overallRoi}%</p>
              <p className="mt-1 text-xs text-primary-500">Return on operational capital</p>
            </div>
          </div>

          {/* Expense Categories Breakdown */}
          {Object.keys(categoryTotals).length > 0 && (
            <div className="card space-y-4">
              <div className="flex items-center gap-2 text-primary-950 font-bold text-base">
                <PieChart className="h-4 w-4 text-primary-600" />
                <span>Expense Breakdown by Input Category</span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(categoryTotals).map(([cat, amount]) => {
                  const pct = totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0;
                  return (
                    <div key={cat} className="rounded-xl border border-primary-100 bg-primary-50/40 p-3 space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="capitalize text-primary-800">{cat}</span>
                        <span className="text-primary-950">{formatCurrencyINR(amount)}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-primary-200/60">
                        <div
                          className="h-full rounded-full bg-primary-600"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-primary-400 text-right">{pct}% of total cost</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Season Journey Performance Cards */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-primary-950">
              {viewMode === "crop" ? "Crop Cycle Performance" : "Season-over-Season Journey"}
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              {displayedSeasons.map((s) => (
                <div key={s.crop_cycle.id} className="card space-y-3 border hover:border-primary-300 transition shadow-2xs">
                  <div className="flex items-start justify-between border-b border-primary-100 pb-2.5">
                    <div>
                      <span className="text-xs font-semibold text-primary-500 uppercase tracking-wider">
                        {s.crop_cycle.season} {s.crop_cycle.year}
                      </span>
                      <h3 className="text-base font-bold text-primary-950 mt-0.5">
                        {s.crop_cycle.crop_name}
                      </h3>
                      <p className="text-xs text-primary-500">
                        Sown: {formatDate(s.crop_cycle.sowing_date)}
                        {s.crop_cycle.actual_harvest_date ? ` • Harvested: ${formatDate(s.crop_cycle.actual_harvest_date)}` : ""}
                      </p>
                    </div>
                    <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-semibold text-primary-800 capitalize">
                      {s.crop_cycle.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center py-1">
                    <div className="rounded-lg bg-emerald-50/70 p-2">
                      <p className="text-[10px] font-bold uppercase text-emerald-800">Revenue</p>
                      <p className="text-sm font-bold text-emerald-950 mt-0.5">
                        {formatCurrencyINR(s.financials?.total_revenue || 0)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-rose-50/70 p-2">
                      <p className="text-[10px] font-bold uppercase text-rose-800">Cost</p>
                      <p className="text-sm font-bold text-rose-950 mt-0.5">
                        {formatCurrencyINR(s.financials?.total_expenses || 0)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-primary-50 p-2">
                      <p className="text-[10px] font-bold uppercase text-primary-800">Profit</p>
                      <p
                        className={cn(
                          "text-sm font-bold mt-0.5",
                          (s.financials?.net_profit || 0) >= 0 ? "text-emerald-700" : "text-rose-700"
                        )}
                      >
                        {formatCurrencyINR(s.financials?.net_profit || 0)}
                      </p>
                    </div>
                  </div>

                  {s.yield?.total_quantity > 0 && (
                    <div className="text-xs text-primary-600 flex items-center justify-between border-t border-primary-50 pt-2">
                      <span>Harvested Yield:</span>
                      <strong>
                        {s.yield.total_quantity} {s.yield.unit}
                      </strong>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
