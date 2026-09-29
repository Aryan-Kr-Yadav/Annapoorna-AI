"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useApi } from "@/lib/api-client";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tabs } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { formatCurrencyINR, formatDate } from "@/lib/utils";
import type { CropCycle, Lifecycle, CropTask } from "@/lib/types";

function OverviewTab({ crop, lifecycle }: { crop: CropCycle; lifecycle: Lifecycle | null }) {
  return (
    <div className="space-y-4">
      <div className="card">
        <p className="text-sm text-primary-500">{crop.season} {crop.year}</p>
        <h2 className="text-xl font-semibold text-primary-900">{crop.crop_name}{crop.variety && ` — ${crop.variety}`}</h2>
        {lifecycle && (
          <>
            <p className="mt-2 text-sm text-primary-700">Day {lifecycle.day_number} • {lifecycle.current_stage}</p>
            {lifecycle.progress_percentage !== null && (
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-primary-100">
                <div className="h-full rounded-full bg-primary-600" style={{ width: `${lifecycle.progress_percentage}%` }} />
              </div>
            )}
            {lifecycle.note && <p className="mt-2 text-xs text-primary-400">{lifecycle.note}</p>}
          </>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="card"><p className="text-primary-500">Sowing date</p><p className="font-medium text-primary-900">{formatDate(crop.sowing_date)}</p></div>
        <div className="card"><p className="text-primary-500">Expected harvest</p><p className="font-medium text-primary-900">{formatDate(crop.expected_harvest_date)}</p></div>
      </div>
    </div>
  );
}

function TimelineTab({ lifecycle }: { lifecycle: Lifecycle | null }) {
  if (!lifecycle || lifecycle.stages.length === 0) return <EmptyState title="No lifecycle data" description="This crop doesn't have a defined lifecycle yet." />;
  return (
    <div className="card space-y-3">
      {lifecycle.stages.map((s) => {
        const isCurrent = s.name === lifecycle.current_stage;
        return (
          <div key={s.name} className="flex items-center gap-3">
            <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${isCurrent ? "bg-primary-600" : lifecycle.day_number >= s.end_day ? "bg-primary-300" : "bg-primary-100"}`} />
            <div className="flex-1">
              <p className={`text-sm ${isCurrent ? "font-semibold text-primary-900" : "text-primary-700"}`}>{s.name}</p>
              <p className="text-xs text-primary-400">Day {s.start_day}–{s.end_day} (estimate)</p>
            </div>
            {isCurrent && <Badge variant="success">Today</Badge>}
          </div>
        );
      })}
    </div>
  );
}

function TasksTab({ cropId }: { cropId: string }) {
  const api = useApi();
  const [tasks, setTasks] = useState<CropTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  function load() {
    setLoading(true);
    api.get<CropTask[]>(`/crops/${cropId}/tasks`).then(setTasks).finally(() => setLoading(false));
  }
  useEffect(load, [cropId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await api.post(`/crops/${cropId}/tasks`, { title, task_type: "custom", scheduled_date: date, priority: "medium" });
    setTitle("");
    load();
  }

  async function toggle(task: CropTask) {
    await api.put(`/tasks/${task.id}`, { status: task.status === "completed" ? "pending" : "completed" });
    load();
  }

  if (loading) return <CardSkeleton />;

  return (
    <div className="space-y-4">
      <form onSubmit={addTask} className="flex flex-wrap gap-2">
        <input className="input flex-1" placeholder="New task" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input type="date" className="input w-40" value={date} onChange={(e) => setDate(e.target.value)} />
        <button className="btn-primary">Add</button>
      </form>
      {tasks.length === 0 ? (
        <EmptyState title="No tasks yet" description="Add a task above, or let the lifecycle engine suggest some as your crop progresses." />
      ) : (
        <div className="card divide-y divide-primary-100">
          {tasks.map((t) => (
            <div key={t.id} className="flex items-center gap-3 py-2.5">
              <input type="checkbox" checked={t.status === "completed"} onChange={() => toggle(t)} className="h-4 w-4 rounded border-primary-300 text-primary-600" />
              <div className="flex-1">
                <p className={`text-sm ${t.status === "completed" ? "text-primary-400 line-through" : "text-primary-900"}`}>{t.title}</p>
                <p className="text-xs text-primary-400">{formatDate(t.scheduled_date)} {t.auto_generated && "• suggested"}</p>
              </div>
              <Badge variant={t.priority === "high" ? "danger" : t.priority === "medium" ? "warning" : "default"}>{t.priority}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HealthTab({ cropId }: { cropId: string }) {
  const api = useApi();
  const [diagnoses, setDiagnoses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get<any[]>(`/crops/${cropId}/diagnoses`).then(setDiagnoses).finally(() => setLoading(false)); }, [cropId]); // eslint-disable-line react-hooks/exhaustive-deps
  if (loading) return <CardSkeleton />;
  if (diagnoses.length === 0) return <EmptyState title="No inspections yet" description="Use Crop Doctor to run your first inspection on this crop." />;
  return (
    <div className="card divide-y divide-primary-100">
      {diagnoses.map((d) => (
        <div key={d.id} className="py-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-primary-900">{d.possible_condition || "No condition identified"}</p>
            <Badge variant={d.severity === "high" ? "danger" : d.severity === "medium" ? "warning" : "success"}>{d.severity}</Badge>
          </div>
          <p className="text-xs text-primary-400">{formatDate(d.created_at)} • Confidence: {d.confidence_percentage !== null ? `${d.confidence_percentage}%` : "unavailable"}</p>
          {d.recommendation && <p className="mt-1 text-sm text-primary-600">{d.recommendation}</p>}
        </div>
      ))}
    </div>
  );
}

function IrrigationTab({ cropId }: { cropId: string }) {
  const api = useApi();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState("flood");

  function load() { api.get<any[]>(`/crops/${cropId}/irrigation`).then(setLogs).finally(() => setLoading(false)); }
  useEffect(load, [cropId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function addLog(e: React.FormEvent) {
    e.preventDefault();
    await api.post(`/crops/${cropId}/irrigation`, { date, method });
    load();
  }

  if (loading) return <CardSkeleton />;
  return (
    <div className="space-y-4">
      <form onSubmit={addLog} className="flex flex-wrap gap-2">
        <input type="date" className="input w-40" value={date} onChange={(e) => setDate(e.target.value)} />
        <select className="input w-40" value={method} onChange={(e) => setMethod(e.target.value)}>
          <option value="flood">Flood</option><option value="drip">Drip</option><option value="sprinkler">Sprinkler</option><option value="canal">Canal</option><option value="other">Other</option>
        </select>
        <button className="btn-primary">Log irrigation</button>
      </form>
      {logs.length === 0 ? <EmptyState title="No irrigation logged yet" /> : (
        <div className="card divide-y divide-primary-100">
          {logs.map((l) => (
            <div key={l.id} className="flex justify-between py-2 text-sm">
              <span className="text-primary-900">{formatDate(l.date)}</span>
              <span className="text-primary-500 capitalize">{l.method}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SoilTab({ cropId }: { cropId: string }) {
  const api = useApi();
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get<any[]>(`/crops/${cropId}/soil-tests`).then(setTests).finally(() => setLoading(false)); }, [cropId]); // eslint-disable-line react-hooks/exhaustive-deps
  if (loading) return <CardSkeleton />;
  if (tests.length === 0) return <EmptyState title="No soil tests recorded" description="Record a soil test to see nutrient ratings here." />;
  return (
    <div className="space-y-4">
      {tests.map((t) => (
        <div key={t.test.id} className="card">
          <p className="text-sm text-primary-500">{formatDate(t.test.test_date)}</p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {t.assessments.map((a: any) => (
              <div key={a.parameter} className="rounded-lg bg-primary-50 px-3 py-2">
                <p className="text-xs text-primary-500">{a.parameter}</p>
                <p className="text-sm font-medium text-primary-900">{a.value ?? "—"} <span className="text-xs text-primary-500">({a.rating})</span></p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ExpensesTab({ cropId }: { cropId: string }) {
  const api = useApi();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("seeds");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  function load() { api.get<any[]>(`/crops/${cropId}/expenses`).then(setExpenses).finally(() => setLoading(false)); }
  useEffect(load, [cropId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function addExpense(e: React.FormEvent) {
    e.preventDefault();
    if (!amount) return;
    await api.post(`/crops/${cropId}/expenses`, { category, amount: parseFloat(amount), date });
    setAmount("");
    load();
  }

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);

  if (loading) return <CardSkeleton />;
  return (
    <div className="space-y-4">
      <form onSubmit={addExpense} className="flex flex-wrap gap-2">
        <select className="input w-36" value={category} onChange={(e) => setCategory(e.target.value)}>
          {["seeds", "fertilizer", "pesticides", "labour", "irrigation", "machinery", "transport", "other"].map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input type="number" step="0.01" placeholder="Amount (₹)" className="input w-32" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <input type="date" className="input w-40" value={date} onChange={(e) => setDate(e.target.value)} />
        <button className="btn-primary">Add expense</button>
      </form>
      <p className="text-sm font-medium text-primary-900">Total: {formatCurrencyINR(total)}</p>
      {expenses.length === 0 ? <EmptyState title="No expenses logged yet" /> : (
        <div className="card divide-y divide-primary-100">
          {expenses.map((e) => (
            <div key={e.id} className="flex justify-between py-2 text-sm">
              <span className="capitalize text-primary-900">{e.category}</span>
              <span className="text-primary-500">{formatDate(e.date)}</span>
              <span className="font-medium text-primary-900">{formatCurrencyINR(Number(e.amount))}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AnalyticsTab({ cropId }: { cropId: string }) {
  const api = useApi();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get<any>(`/crops/${cropId}/season-report`).then(setReport).finally(() => setLoading(false)); }, [cropId]); // eslint-disable-line react-hooks/exhaustive-deps
  if (loading) return <CardSkeleton />;
  if (!report) return null;
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      <div className="card"><p className="text-xs text-primary-500">Total Expenses</p><p className="text-lg font-semibold text-primary-900">{formatCurrencyINR(report.total_expenses)}</p></div>
      <div className="card"><p className="text-xs text-primary-500">Revenue</p><p className="text-lg font-semibold text-primary-900">{report.revenue !== null ? formatCurrencyINR(report.revenue) : "Not harvested yet"}</p></div>
      <div className="card"><p className="text-xs text-primary-500">Profit</p><p className="text-lg font-semibold text-primary-900">{report.profit !== null ? formatCurrencyINR(report.profit) : "—"}</p></div>
      <div className="card"><p className="text-xs text-primary-500">ROI</p><p className="text-lg font-semibold text-primary-900">{report.roi_percentage !== null ? `${report.roi_percentage}%` : "—"}</p></div>
      <div className="card"><p className="text-xs text-primary-500">Irrigation Events</p><p className="text-lg font-semibold text-primary-900">{report.total_irrigation_events}</p></div>
      <div className="card"><p className="text-xs text-primary-500">Health Events</p><p className="text-lg font-semibold text-primary-900">{report.health_events}</p></div>
    </div>
  );
}

function HarvestSalesTab({ crop, onRefresh }: { crop: CropCycle; onRefresh: () => void }) {
  const api = useApi();
  const [harvests, setHarvests] = useState<any[]>([]);
  const [salesSummary, setSalesSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showHarvestForm, setShowHarvestForm] = useState(false);
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [harvestForm, setHarvestForm] = useState({
    harvest_date: new Date().toISOString().slice(0, 10),
    yield_quantity: "",
    yield_unit: "quintal",
  });

  const [saleForm, setSaleForm] = useState({
    sale_date: new Date().toISOString().slice(0, 10),
    quantity_sold: "",
    quantity_unit: "quintal",
    price_per_unit: "",
    buyer_name: "",
    notes: "",
  });

  function load() {
    setLoading(true);
    setError(null);
    Promise.all([
      api.get<any[]>(`/crops/${crop.id}/harvests`),
      api.get<any>(`/crops/${crop.id}/sales`),
    ])
      .then(([h, s]) => {
        setHarvests(h);
        setSalesSummary(s);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, [crop.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAddHarvest(e: React.FormEvent) {
    e.preventDefault();
    if (!harvestForm.yield_quantity) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.post(`/crops/${crop.id}/harvests`, {
        harvest_date: harvestForm.harvest_date,
        yield_quantity: parseFloat(harvestForm.yield_quantity),
        yield_unit: harvestForm.yield_unit,
      });
      setShowHarvestForm(false);
      load();
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRecordSale(e: React.FormEvent) {
    e.preventDefault();
    if (!saleForm.quantity_sold || !saleForm.price_per_unit) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.post(`/crops/${crop.id}/sales`, {
        sale_date: saleForm.sale_date,
        quantity_sold: parseFloat(saleForm.quantity_sold),
        quantity_unit: saleForm.quantity_unit,
        price_per_unit: parseFloat(saleForm.price_per_unit),
        buyer_name: saleForm.buyer_name || null,
        notes: saleForm.notes || null,
      });
      setShowSaleForm(false);
      load();
      onRefresh();
    } catch (err: any) {
      setError(err.message || "Failed to record sale.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <CardSkeleton />;

  const totalHarvested = salesSummary?.total_harvested_quantity || 0;
  const totalSold = salesSummary?.total_quantity_sold || 0;
  const remaining = salesSummary?.remaining_quantity || 0;
  const totalRevenue = salesSummary?.total_revenue || 0;
  const salesList = salesSummary?.sales || [];
  const unit = salesSummary?.quantity_unit || "quintal";

  return (
    <div className="space-y-6">
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {/* Summary Header */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="card">
          <p className="text-xs text-primary-500">Status</p>
          <div className="mt-1">
            <Badge variant={crop.status === "sold" ? "success" : crop.status === "harvested" ? "warning" : "default"}>
              {crop.status.toUpperCase()}
            </Badge>
          </div>
        </div>
        <div className="card">
          <p className="text-xs text-primary-500">Harvested Quantity</p>
          <p className="text-base font-semibold text-primary-900">{totalHarvested} {unit}</p>
        </div>
        <div className="card">
          <p className="text-xs text-primary-500">Quantity Sold / Remaining</p>
          <p className="text-base font-semibold text-primary-900">{totalSold} / <span className="text-emerald-700">{remaining} {unit}</span></p>
        </div>
        <div className="card">
          <p className="text-xs text-primary-500">Total Sales Revenue</p>
          <p className="text-base font-semibold text-emerald-800">{formatCurrencyINR(totalRevenue)}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-medium text-primary-900">Harvest & Sales Records</h3>
        <div className="flex gap-2">
          <button onClick={() => setShowHarvestForm((s) => !s)} className="btn-secondary">
            + Log Harvest
          </button>
          {totalHarvested > 0 && (
            <button onClick={() => { setSaleForm({ ...saleForm, quantity_unit: unit }); setShowSaleForm(true); }} className="btn-primary">
              Record Sale
            </button>
          )}
        </div>
      </div>

      {/* Harvest Form */}
      {showHarvestForm && (
        <form onSubmit={handleAddHarvest} className="card space-y-3">
          <h4 className="font-semibold text-primary-900 text-sm">Record Crop Harvest</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="label">Harvest Date</label>
              <input type="date" required className="input" value={harvestForm.harvest_date} onChange={(e) => setHarvestForm({ ...harvestForm, harvest_date: e.target.value })} />
            </div>
            <div>
              <label className="label">Yield Quantity</label>
              <input type="number" step="0.01" min="0.01" required className="input" value={harvestForm.yield_quantity} onChange={(e) => setHarvestForm({ ...harvestForm, yield_quantity: e.target.value })} />
            </div>
            <div>
              <label className="label">Unit</label>
              <select className="input" value={harvestForm.yield_unit} onChange={(e) => setHarvestForm({ ...harvestForm, yield_unit: e.target.value })}>
                <option value="quintal">quintal</option>
                <option value="kg">kg</option>
                <option value="tonne">tonne</option>
                <option value="bag">bag</option>
              </select>
            </div>
          </div>
          <button disabled={submitting} className="btn-primary">{submitting ? "Saving..." : "Save Harvest"}</button>
        </form>
      )}

      {/* Harvests List */}
      <div>
        <h4 className="text-sm font-semibold text-primary-900 mb-2">Recorded Harvests ({harvests.length})</h4>
        {harvests.length === 0 ? (
          <EmptyState title="No harvest recorded" description="When this crop is harvested, click Log Harvest above." />
        ) : (
          <div className="card divide-y divide-primary-100">
            {harvests.map((h) => (
              <div key={h.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="font-medium text-primary-900">Harvested {h.yield_quantity} {h.yield_unit}</p>
                  <p className="text-xs text-primary-500">Date: {formatDate(h.harvest_date)}</p>
                </div>
                {h.revenue && <p className="text-xs text-primary-600">Estimated Value: {formatCurrencyINR(h.revenue)}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sales List */}
      <div>
        <h4 className="text-sm font-semibold text-primary-900 mb-2">Recorded Produce Sales ({salesList.length})</h4>
        {salesList.length === 0 ? (
          <EmptyState title="No sales recorded yet" description="Record produce sales to track actual revenue and profit." />
        ) : (
          <div className="card divide-y divide-primary-100">
            {salesList.map((s: any) => (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <div>
                  <p className="font-medium text-primary-900">Sold {s.quantity_sold} {s.quantity_unit} @ {formatCurrencyINR(s.price_per_unit)}/{s.quantity_unit}</p>
                  <p className="text-xs text-primary-500">Date: {formatDate(s.sale_date)} {s.buyer_name && `• Buyer: ${s.buyer_name}`}</p>
                  {s.notes && <p className="text-xs text-primary-400 mt-0.5">{s.notes}</p>}
                </div>
                <div className="text-right">
                  <p className="font-semibold text-emerald-800">{formatCurrencyINR(s.total_sale_value)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Record Sale Modal */}
      {showSaleForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <form onSubmit={handleRecordSale} className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-primary-100 space-y-4">
            <h3 className="text-lg font-semibold text-primary-900">Record Produce Sale</h3>
            <p className="text-xs text-primary-600">
              Remaining unsold harvest: <strong>{remaining} {unit}</strong>
            </p>
            {error && <p className="rounded-lg bg-red-50 p-2 text-xs text-red-700">{error}</p>}
            <div>
              <label className="label">Sale Date</label>
              <input type="date" required className="input" value={saleForm.sale_date} onChange={(e) => setSaleForm({ ...saleForm, sale_date: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Quantity Sold</label>
                <input type="number" step="0.01" max={remaining > 0 ? remaining : undefined} required className="input" value={saleForm.quantity_sold} onChange={(e) => setSaleForm({ ...saleForm, quantity_sold: e.target.value })} />
              </div>
              <div>
                <label className="label">Unit</label>
                <input className="input bg-primary-50" readOnly value={unit} />
              </div>
            </div>
            <div>
              <label className="label">Price per {unit} (₹)</label>
              <input type="number" step="0.01" required className="input" placeholder="e.g. 2150" value={saleForm.price_per_unit} onChange={(e) => setSaleForm({ ...saleForm, price_per_unit: e.target.value })} />
            </div>
            {saleForm.quantity_sold && saleForm.price_per_unit && (
              <div className="rounded-lg bg-emerald-50 p-2.5 text-xs text-emerald-900">
                Total Sale Value: <strong>{formatCurrencyINR(parseFloat(saleForm.quantity_sold) * parseFloat(saleForm.price_per_unit))}</strong>
              </div>
            )}
            <div>
              <label className="label">Buyer / Market Name (Optional)</label>
              <input className="input" placeholder="e.g. Karnal Mandi Trader / Local Co-op" value={saleForm.buyer_name} onChange={(e) => setSaleForm({ ...saleForm, buyer_name: e.target.value })} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowSaleForm(false)} className="btn-secondary">Cancel</button>
              <button disabled={submitting} className="btn-primary">{submitting ? "Saving..." : "Record Sale"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default function CropDetailPage() {
  const { id } = useParams<{ id: string }>();
  const api = useApi();
  const [crop, setCrop] = useState<CropCycle | null>(null);
  const [lifecycle, setLifecycle] = useState<Lifecycle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    setError(null);
    Promise.all([api.get<CropCycle>(`/crops/${id}`), api.get<Lifecycle>(`/crops/${id}/lifecycle`)])
      .then(([c, l]) => { setCrop(c); setLifecycle(l); })
      .catch((e) => setError(e.message || "Could not load this crop."))
      .finally(() => setLoading(false));
  }
  useEffect(load, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <CardSkeleton />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!crop) return null;

  return (
    <Tabs
      tabs={[
        { id: "overview", label: "Overview", content: <OverviewTab crop={crop} lifecycle={lifecycle} /> },
        { id: "timeline", label: "Timeline", content: <TimelineTab lifecycle={lifecycle} /> },
        { id: "tasks", label: "Tasks", content: <TasksTab cropId={crop.id} /> },
        { id: "health", label: "Health", content: <HealthTab cropId={crop.id} /> },
        { id: "irrigation", label: "Irrigation", content: <IrrigationTab cropId={crop.id} /> },
        { id: "soil", label: "Soil", content: <SoilTab cropId={crop.id} /> },
        { id: "expenses", label: "Expenses", content: <ExpensesTab cropId={crop.id} /> },
        { id: "harvest", label: "Harvest & Sales", content: <HarvestSalesTab crop={crop} onRefresh={load} /> },
        { id: "analytics", label: "Analytics", content: <AnalyticsTab cropId={crop.id} /> },
      ]}
    />
  );
}
