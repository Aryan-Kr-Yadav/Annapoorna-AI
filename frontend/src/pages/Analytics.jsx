import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  PieChart as PieChartIcon,
  BarChart3,
  Calendar,
  Layers,
  Sprout,
  CheckCircle2,
  Tractor,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useFarms } from "../contexts/FarmContext";
import { useTranslation } from "../contexts/LanguageContext";
import analyticsApi from "../api/analytics";
import PageHeader from "../components/common/PageHeader";
import MetricCard from "../components/common/MetricCard";
import Skeleton from "../components/common/Skeleton";
import EmptyState from "../components/common/EmptyState";
import { formatCurrencyINR, formatDate } from "../utils/formatters";

const PIE_COLORS = ["#16a34a", "#eab308", "#0284c7", "#8b5cf6", "#f97316", "#ef4444", "#14b8a6"];

export default function Analytics() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { selectedFarm, selectFarm, farms, crops, selectedCrop, selectCrop } = useFarms();

  const [viewMode, setViewMode] = useState("farm"); // 'farm' | 'crop'
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAnalytics = useCallback(async () => {
    if (!selectedFarm?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await analyticsApi.getFarmSeasons(selectedFarm.id);
      setSeasons(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || "Failed to load farm analytics.");
    } finally {
      setLoading(false);
    }
  }, [selectedFarm?.id]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // Filter based on viewMode
  const displayedSeasons =
    viewMode === "crop" && selectedCrop
      ? seasons.filter((s) => s.crop_cycle?.id === selectedCrop.id)
      : seasons;

  // Aggregate metrics
  const totalRevenue = displayedSeasons.reduce((acc, s) => acc + (s.financials?.total_revenue || 0), 0);
  const totalExpenses = displayedSeasons.reduce((acc, s) => acc + (s.financials?.total_expenses || 0), 0);
  const netProfit = totalRevenue - totalExpenses;
  const avgRoi = totalExpenses > 0 ? Math.round((netProfit / totalExpenses) * 100) : 0;

  // Aggregate expenses by category for pie chart
  const categoryTotals = {};
  displayedSeasons.forEach((s) => {
    if (s.expenses_by_category) {
      Object.entries(s.expenses_by_category).forEach(([cat, amt]) => {
        categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(amt);
      });
    }
  });

  const pieData = Object.entries(categoryTotals).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  // Bar chart data: season by season comparison
  const barData = displayedSeasons.map((s) => ({
    name: `${s.crop_cycle?.crop_name || "Crop"} (${s.crop_cycle?.season || ""})`,
    Expenses: s.financials?.total_expenses || 0,
    Revenue: s.financials?.total_revenue || 0,
    Profit: s.financials?.net_profit || 0,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <PageHeader
            title={t("analytics.title", "Farm Financials & Season Analytics")}
            subtitle="Commercial yield performance, expense distributions, and net agricultural profit margins."
          />
        </div>

        {/* View Mode Toggle & Farm/Crop Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-lg border border-slate-200 p-0.5 text-xs dark:border-slate-800">
            <button
              onClick={() => setViewMode("farm")}
              className={`rounded-md px-3 py-1.5 font-semibold transition ${
                viewMode === "farm"
                  ? "bg-primary-600 text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
              }`}
            >
              Farm Overview
            </button>
            <button
              onClick={() => setViewMode("crop")}
              className={`rounded-md px-3 py-1.5 font-semibold transition ${
                viewMode === "crop"
                  ? "bg-primary-600 text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
              }`}
            >
              Crop Cycle Only
            </button>
          </div>

          {viewMode === "crop" && (
            <select
              value={selectedCrop?.id || ""}
              onChange={(e) => selectCrop(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:border-[#1e3627] dark:bg-[#121c15] dark:text-stone-100"
            >
              {crops.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.crop_name} ({c.season})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Aggregate Metric Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard
          label="Total Crop Revenue"
          value={formatCurrencyINR(totalRevenue)}
          icon={TrendingUp}
          variant="success"
        />
        <MetricCard
          label="Operational Expenses"
          value={formatCurrencyINR(totalExpenses)}
          icon={Wallet}
        />
        <MetricCard
          label="Net Farm Profit"
          value={formatCurrencyINR(netProfit)}
          icon={DollarSign}
          variant={netProfit >= 0 ? "success" : "error"}
        />
        <MetricCard
          label="Average ROI"
          value={`${avgRoi}%`}
          subtext="Net return on input spend"
          icon={BarChart3}
        />
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : displayedSeasons.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No season analytics available yet"
          description="Log crop expenses, harvests, and mandi sales to generate financial performance reports."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Revenue vs Expenses Chart */}
          <div className="card space-y-4 lg:col-span-7">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Revenue vs Expenses by Crop Cycle
            </h3>
            <div className="h-64 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip
                    formatter={(v) => formatCurrencyINR(v)}
                    contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                  />
                  <Legend />
                  <Bar dataKey="Revenue" fill="#16a34a" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Expenses" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Expense Category Distribution */}
          <div className="card space-y-4 lg:col-span-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Expense Allocation Breakdown
            </h3>
            {pieData.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-12">No expenses categorized.</p>
            ) : (
              <div className="h-64 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
                      innerRadius={40}
                      paddingAngle={3}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) => formatCurrencyINR(v)}
                      contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Season Reports Table */}
          <div className="card p-0 overflow-x-auto lg:col-span-12">
            <div className="border-b border-slate-100 p-4 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Detailed Season Breakdown</h3>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">Crop Cycle</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Harvest Quantity</th>
                  <th className="px-4 py-3 font-semibold">Total Revenue</th>
                  <th className="px-4 py-3 font-semibold">Total Expenses</th>
                  <th className="px-4 py-3 font-semibold">Net Profit</th>
                  <th className="px-4 py-3 font-semibold">ROI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {displayedSeasons.map((s, idx) => {
                  const profit = (s.financials?.total_revenue || 0) - (s.financials?.total_expenses || 0);
                  return (
                    <tr key={idx} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                        {s.crop_cycle?.crop_name} ({s.crop_cycle?.season} {s.crop_cycle?.year})
                      </td>
                      <td className="px-4 py-3">
                        <span className="capitalize text-slate-600 dark:text-slate-400">
                          {s.crop_cycle?.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                        {s.yield?.total_quantity || 0} {s.yield?.unit || "kg"}
                      </td>
                      <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrencyINR(s.financials?.total_revenue || 0)}
                      </td>
                      <td className="px-4 py-3 text-slate-900 dark:text-white">
                        {formatCurrencyINR(s.financials?.total_expenses || 0)}
                      </td>
                      <td className={`px-4 py-3 font-bold ${profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600"}`}>
                        {formatCurrencyINR(profit)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                        {s.financials?.roi_pct != null ? `${Math.round(s.financials.roi_pct)}%` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
