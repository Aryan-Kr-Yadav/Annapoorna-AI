"use client";

import { useEffect, useState } from "react";
import { useFarms } from "@/lib/farm-context";
import { useApi } from "@/lib/api-client";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrencyINR } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { LineChart as LineChartIcon } from "lucide-react";

export default function AnalyticsPage() {
  const api = useApi();
  const { selectedFarm } = useFarms();
  const [seasons, setSeasons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedFarm) return;
    setLoading(true);
    api.get<any[]>(`/analytics/farms/${selectedFarm.id}/seasons`).then(setSeasons).finally(() => setLoading(false));
  }, [selectedFarm?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <CardSkeleton />;
  if (seasons.length === 0) return <EmptyState icon={LineChartIcon} title="No season data yet" description="Complete a crop cycle with expenses and a harvest to see analytics here." />;

  const chartData = seasons.map((s) => ({
    name: `${s.crop_cycle.crop_name} ${s.crop_cycle.year}`,
    Expenses: s.total_expenses,
    Revenue: s.revenue || 0,
    Profit: s.profit || 0,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-primary-900">Farm Analytics</h1>
      <div className="card h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <XAxis dataKey="name" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip formatter={(v: number) => formatCurrencyINR(v)} />
            <Bar dataKey="Expenses" fill="#a0c97e" />
            <Bar dataKey="Revenue" fill="#5c9438" />
            <Bar dataKey="Profit" fill="#375c23" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {seasons.map((s, i) => (
          <div key={i} className="card">
            <p className="font-medium text-primary-900">{s.crop_cycle.crop_name} — {s.crop_cycle.season} {s.crop_cycle.year}</p>
            <p className="mt-1 text-sm text-primary-600">Expenses: {formatCurrencyINR(s.total_expenses)}</p>
            <p className="text-sm text-primary-600">Profit: {s.profit !== null ? formatCurrencyINR(s.profit) : "—"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
