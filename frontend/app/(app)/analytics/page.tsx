"use client";

import { useEffect, useState } from "react";
import { useFarms } from "@/lib/farm-context";
import { useApi } from "@/lib/api-client";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrencyINR } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";
import {
  LineChart as LineChartIcon,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart as PieIcon,
  Calendar,
  Droplets,
  Stethoscope,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Package,
} from "lucide-react";
import Link from "next/link";

interface SeasonReport {
  crop_cycle: {
    id: string;
    crop_name: string;
    season: string;
    year: number;
    sowing_date: string;
    status: string;
  };
  duration_days: number | null;
  total_expenses: number;
  expense_breakdown: Record<string, number>;
  total_irrigation_events: number;
  health_events: number;
  yield_quantity: number | null;
  revenue: number | null;
  profit: number | null;
  roi_percentage: number | null;
  cost_per_unit_yield: number | null;
}

export default function AnalyticsPage() {
  const api = useApi();
  const { selectedFarm } = useFarms();
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

  if (loading) return <CardSkeleton />;

  if (seasons.length === 0) {
    return (
      <EmptyState
        icon={LineChartIcon}
        title="No season data yet"
        description="Complete crop cycles, record expenses and sales/harvests to see deep analytics, financial breakdowns, and seasonal performance insights here."
      />
    );
  }

  // Header Calculations
  const totalExpenses = seasons.reduce((acc, s) => acc + (s.total_expenses || 0), 0);
  const totalRevenue = seasons.reduce((acc, s) => acc + (s.revenue || 0), 0);
  const netProfit = totalRevenue - totalExpenses;
  const overallRoi = totalExpenses > 0 ? (netProfit / totalExpenses) * 100 : 0;

  // Category Breakdown Aggregation
  const categoryTotals: Record<string, number> = {};
  seasons.forEach((s) => {
    if (s.expense_breakdown) {
      Object.entries(s.expense_breakdown).forEach(([cat, val]) => {
        categoryTotals[cat] = (categoryTotals[cat] || 0) + val;
      });
    }
  });

  const categoryEntries = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  const highestExpenseCategory = categoryEntries.length > 0 ? categoryEntries[0] : null;

  // Most profitable season
  const profitableSeasons = seasons.filter((s) => s.profit !== null);
  const bestSeason = profitableSeasons.length > 0
    ? [...profitableSeasons].sort((a, b) => (b.profit || 0) - (a.profit || 0))[0]
    : null;

  // Chart Data
  const chartData = seasons.map((s) => ({
    name: `${s.crop_cycle.crop_name} (${s.crop_cycle.season.substring(0, 3)} ${s.crop_cycle.year})`,
    Expenses: s.total_expenses,
    Revenue: s.revenue || 0,
    Profit: s.profit || 0,
  }));

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary-900">Farm Performance & Analytics</h1>
        <p className="mt-1 text-sm text-primary-600">
          Financial performance, expense distribution, and seasonal breakdown for {selectedFarm?.name}.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Expenses */}
        <div className="card border-l-4 border-l-rose-500 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary-500">
              Total Expenses
            </span>
            <div className="rounded-full bg-rose-50 p-2 text-rose-600">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-primary-900">
            {formatCurrencyINR(totalExpenses)}
          </p>
          <p className="mt-1 text-xs text-primary-500">Across {seasons.length} recorded season(s)</p>
        </div>

        {/* Total Revenue */}
        <div className="card border-l-4 border-l-emerald-500 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary-500">
              Total Revenue
            </span>
            <div className="rounded-full bg-emerald-50 p-2 text-emerald-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-primary-900">
            {formatCurrencyINR(totalRevenue)}
          </p>
          <p className="mt-1 text-xs text-primary-500">From harvests and crop sales</p>
        </div>

        {/* Net Profit */}
        <div className={`card border-l-4 p-5 ${netProfit >= 0 ? "border-l-primary-600" : "border-l-amber-500"}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary-500">
              Net Profit / Loss
            </span>
            <div className={`rounded-full p-2 ${netProfit >= 0 ? "bg-primary-50 text-primary-600" : "bg-amber-50 text-amber-600"}`}>
              {netProfit >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            </div>
          </div>
          <p className={`mt-2 text-2xl font-bold ${netProfit >= 0 ? "text-primary-900" : "text-amber-700"}`}>
            {formatCurrencyINR(netProfit)}
          </p>
          <p className="mt-1 text-xs text-primary-500">Net cumulative margin</p>
        </div>

        {/* ROI */}
        <div className="card border-l-4 border-l-sky-500 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary-500">
              Average ROI
            </span>
            <div className="rounded-full bg-sky-50 p-2 text-sky-600">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-primary-900">
            {overallRoi > 0 ? `+${overallRoi.toFixed(1)}%` : `${overallRoi.toFixed(1)}%`}
          </p>
          <p className="mt-1 text-xs text-primary-500">Return on capital invested</p>
        </div>
      </div>

      {/* Main Charts & Expense Breakdown Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue vs Expenses Chart (2 cols) */}
        <div className="card p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-primary-900">Season-over-Season Financials</h2>
              <p className="text-xs text-primary-500">Comparison of total input cost vs crop revenue</p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={{ stroke: "#e5e7eb" }} />
                <YAxis fontSize={11} tickLine={false} axisLine={{ stroke: "#e5e7eb" }} />
                <Tooltip
                  formatter={(v: number) => [formatCurrencyINR(v), ""]}
                  contentStyle={{ backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #e5e7eb" }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                <Bar dataKey="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Profit" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Category Breakdown (1 col) */}
        <div className="card p-6 flex flex-col justify-between">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-primary-900">Expense Breakdown</h2>
              <PieIcon className="h-4 w-4 text-primary-400" />
            </div>

            {categoryEntries.length === 0 ? (
              <p className="py-8 text-center text-xs text-primary-400">No expense records recorded yet.</p>
            ) : (
              <div className="space-y-4">
                {categoryEntries.map(([cat, amount]) => {
                  const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="capitalize text-primary-800">{cat.replace("_", " ")}</span>
                        <span className="text-primary-600">
                          {formatCurrencyINR(amount)} ({percentage.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-primary-100">
                        <div
                          className="h-full bg-primary-600 rounded-full"
                          style={{ width: `${Math.min(100, Math.max(4, percentage))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Smart Insight Box */}
          {highestExpenseCategory && (
            <div className="mt-6 rounded-lg bg-primary-50/70 p-3.5 text-xs text-primary-800 border border-primary-100">
              <span className="font-semibold text-primary-900 flex items-center gap-1 mb-1">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Key Expense Insight
              </span>
              Largest investment was in <strong className="capitalize">{highestExpenseCategory[0].replace("_", " ")}</strong> representing{" "}
              {totalExpenses > 0 ? ((highestExpenseCategory[1] / totalExpenses) * 100).toFixed(0) : 0}% of overall budget.
            </div>
          )}
        </div>
      </div>

      {/* Season Journey Timeline */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-primary-900">Season Journey Timeline</h2>
          <span className="text-xs text-primary-500">Historical performance by crop season</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {seasons.map((s, idx) => {
            const isProfitable = (s.profit || 0) >= 0;
            return (
              <div
                key={s.crop_cycle.id || idx}
                className="card flex flex-col justify-between p-5 hover:border-primary-300 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="inline-block rounded bg-primary-100 px-2 py-0.5 text-[10px] font-semibold text-primary-800 uppercase">
                        {s.crop_cycle.season} {s.crop_cycle.year}
                      </span>
                      <h3 className="mt-1 text-base font-bold text-primary-900">{s.crop_cycle.crop_name}</h3>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                        s.crop_cycle.status === "harvested" || s.crop_cycle.status === "sold"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-sky-100 text-sky-800"
                      }`}
                    >
                      {s.crop_cycle.status}
                    </span>
                  </div>

                  {/* Season Metrics Grid */}
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-surface p-2.5">
                      <span className="text-primary-500 flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Duration
                      </span>
                      <p className="mt-0.5 font-semibold text-primary-800">
                        {s.duration_days ? `${s.duration_days} days` : "Ongoing"}
                      </p>
                    </div>

                    <div className="rounded-lg bg-surface p-2.5">
                      <span className="text-primary-500 flex items-center gap-1">
                        <Package className="h-3 w-3" /> Yield
                      </span>
                      <p className="mt-0.5 font-semibold text-primary-800">
                        {s.yield_quantity !== null ? `${s.yield_quantity} units` : "N/A"}
                      </p>
                    </div>

                    <div className="rounded-lg bg-surface p-2.5">
                      <span className="text-primary-500 flex items-center gap-1">
                        <Droplets className="h-3 w-3 text-sky-500" /> Irrigations
                      </span>
                      <p className="mt-0.5 font-semibold text-primary-800">{s.total_irrigation_events} logs</p>
                    </div>

                    <div className="rounded-lg bg-surface p-2.5">
                      <span className="text-primary-500 flex items-center gap-1">
                        <Stethoscope className="h-3 w-3 text-rose-500" /> Health Checks
                      </span>
                      <p className="mt-0.5 font-semibold text-primary-800">{s.health_events} checks</p>
                    </div>
                  </div>

                  {/* Expenses & Revenue Summary */}
                  <div className="mt-4 space-y-1 text-xs border-t border-primary-100 pt-3">
                    <div className="flex justify-between">
                      <span className="text-primary-500">Expenses:</span>
                      <span className="font-semibold text-rose-600">{formatCurrencyINR(s.total_expenses)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-primary-500">Revenue:</span>
                      <span className="font-semibold text-emerald-600">
                        {s.revenue !== null ? formatCurrencyINR(s.revenue) : "₹0"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Profit / ROI badge */}
                <div className="mt-4 flex items-center justify-between border-t border-primary-100 pt-3">
                  <span className="text-xs text-primary-500">Net Profit</span>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${isProfitable ? "text-emerald-700" : "text-rose-600"}`}>
                      {s.profit !== null ? formatCurrencyINR(s.profit) : "₹0"}
                    </p>
                    {s.roi_percentage !== null && (
                      <p className="text-[10px] text-primary-500">
                        ROI: {s.roi_percentage > 0 ? `+${s.roi_percentage}%` : `${s.roi_percentage}%`}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
