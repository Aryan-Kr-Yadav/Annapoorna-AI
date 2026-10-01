"use client";

import { useState } from "react";
import { useApi } from "@/lib/api-client";
import { useFarms } from "@/lib/farm-context";
import { EmptyState } from "@/components/ui/EmptyState";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { formatCurrencyINR, formatDate } from "@/lib/utils";
import { TrendingUp } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export default function MarketPage() {
  const api = useApi();
  const { t } = useTranslation();
  const { selectedFarm } = useFarms();
  const [crop, setCrop] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function search() {
    if (!crop.trim() || !selectedFarm) return;
    setLoading(true);
    try {
      const data = await api.get<any>(`/market/prices?crop=${encodeURIComponent(crop)}&state=${encodeURIComponent(selectedFarm.state)}`);
      setResult(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-primary-900">{t("market.title")}</h1>
      <div className="flex gap-2">
        <input className="input flex-1" placeholder="Crop name (e.g. Wheat)" value={crop} onChange={(e) => setCrop(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} />
        <button onClick={search} className="btn-primary">Search</button>
      </div>

      {loading && <CardSkeleton />}

      {result && !result.data_available && (
        <EmptyState icon={TrendingUp} title="No cached price data available" description={result.message} />
      )}

      {result?.data_available && (
        <div className="card divide-y divide-primary-100">
          {result.points.map((p: any, i: number) => (
            <div key={i} className="flex items-center justify-between py-2 text-sm">
              <span className="text-primary-900">{p.market_name || "—"}</span>
              <span className="text-primary-500">{formatDate(p.price_date)}</span>
              <span className="font-medium text-primary-900">{formatCurrencyINR(p.modal_price)} / {p.unit}</span>
            </div>
          ))}
          <p className="pt-2 text-xs text-primary-400">Last updated: {formatDate(result.points[result.points.length - 1]?.fetched_at)} — not real-time.</p>
        </div>
      )}
    </div>
  );
}
