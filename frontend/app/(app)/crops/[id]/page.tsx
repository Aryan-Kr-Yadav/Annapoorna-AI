"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useApi } from "@/lib/api-client";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tabs } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { cn, formatCurrencyINR, formatDate } from "@/lib/utils";
import {
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Droplets,
  FlaskConical,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Clock,
  ArrowRight,
  X,
  Sparkles,
  Info,
  Check,
  MoreVertical,
  Pencil,
  ShoppingBag,
  DollarSign,
} from "lucide-react";
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
  const [filter, setFilter] = useState<"all" | "today" | "upcoming" | "completed">("all");
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<CropTask | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    task_type: "custom",
    scheduled_date: new Date().toISOString().slice(0, 10),
    priority: "medium",
  });

  function load() {
    setLoading(true);
    api.get<CropTask[]>(`/crops/${cropId}/tasks`).then(setTasks).finally(() => setLoading(false));
  }
  useEffect(load, [cropId]); // eslint-disable-line react-hooks/exhaustive-deps

  const todayStr = new Date().toISOString().slice(0, 10);

  const filteredTasks = tasks.filter((t) => {
    if (filter === "completed") return t.status === "completed";
    if (filter === "today") return t.status === "pending" && t.scheduled_date === todayStr;
    if (filter === "upcoming") return t.status === "pending" && t.scheduled_date > todayStr;
    return true;
  });

  async function handleSaveTask(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;

    if (editingTask) {
      await api.put(`/tasks/${editingTask.id}`, form);
    } else {
      await api.post(`/crops/${cropId}/tasks`, form);
    }
    setShowModal(false);
    setEditingTask(null);
    setForm({
      title: "",
      description: "",
      task_type: "custom",
      scheduled_date: todayStr,
      priority: "medium",
    });
    load();
  }

  async function toggleStatus(task: CropTask) {
    await api.put(`/tasks/${task.id}`, {
      status: task.status === "completed" ? "pending" : "completed",
    });
    load();
  }

  async function deleteTask(taskId: string) {
    if (!confirm("Are you sure you want to delete this task?")) return;
    await api.delete(`/tasks/${taskId}`);
    load();
  }

  function openEdit(task: CropTask) {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description || "",
      task_type: task.task_type || "custom",
      scheduled_date: task.scheduled_date,
      priority: task.priority || "medium",
    });
    setShowModal(true);
  }

  if (loading) return <CardSkeleton />;

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 rounded-xl bg-primary-100/70 p-1">
          {(["all", "today", "upcoming", "completed"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilter(mode)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${
                filter === mode
                  ? "bg-white text-primary-900 shadow-2xs dark:bg-primary-900/60 dark:text-primary-100"
                  : "text-primary-600 hover:text-primary-900"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            setEditingTask(null);
            setForm({
              title: "",
              description: "",
              task_type: "custom",
              scheduled_date: todayStr,
              priority: "medium",
            });
            setShowModal(true);
          }}
          className="btn-primary text-xs"
        >
          <Plus className="h-4 w-4" /> Add Task
        </button>
      </div>

      {filteredTasks.length === 0 ? (
        <EmptyState
          title={filter === "all" ? "No tasks recorded" : `No ${filter} tasks`}
          description="Create scheduled activities like irrigation, spray, inspection, or fertilization to keep your crop on schedule."
          action={
            <button
              onClick={() => {
                setEditingTask(null);
                setShowModal(true);
              }}
              className="btn-primary"
            >
              <Plus className="h-4 w-4 mr-1" /> Add First Task
            </button>
          }
        />
      ) : (
        <div className="card divide-y divide-primary-100 dark:divide-primary-900/40 p-2">
          {filteredTasks.map((t) => {
            const isCompleted = t.status === "completed";
            const isOverdue = !isCompleted && t.scheduled_date < todayStr;
            return (
              <div
                key={t.id}
                className="flex items-center justify-between gap-3 py-3 px-2 hover:bg-primary-50/50 dark:hover:bg-primary-950/20 transition rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={isCompleted}
                    onChange={() => toggleStatus(t)}
                    className="h-4 w-4 rounded border-primary-300 text-primary-600 cursor-pointer"
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-medium truncate ${
                        isCompleted
                          ? "line-through text-primary-400 dark:text-primary-600"
                          : "text-primary-950 dark:text-primary-100"
                      }`}
                    >
                      {t.title}
                    </p>
                    {t.description && (
                      <p className="text-xs text-primary-500 truncate mt-0.5">{t.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-primary-500">
                      <span>{formatDate(t.scheduled_date)}</span>
                      {isOverdue && (
                        <span className="text-red-600 font-bold flex items-center gap-0.5">
                          <AlertTriangle className="h-3 w-3" /> Overdue
                        </span>
                      )}
                      {t.auto_generated && (
                        <span className="text-emerald-700 font-medium">✨ Suggested</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    variant={
                      t.priority === "high"
                        ? "danger"
                        : t.priority === "medium"
                        ? "warning"
                        : "default"
                    }
                  >
                    {t.priority}
                  </Badge>
                  <button
                    onClick={() => openEdit(t)}
                    className="p-1 text-primary-500 hover:text-primary-800 transition rounded"
                    title="Edit task"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => deleteTask(t.id)}
                    className="p-1 text-red-500 hover:text-red-700 transition rounded"
                    title="Delete task"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <form
            onSubmit={handleSaveTask}
            className="w-full max-w-md rounded-xl bg-white dark:bg-[#1a2318] p-6 shadow-xl border border-primary-200 dark:border-primary-800 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-primary-100 pb-2">
              <h3 className="text-base font-semibold text-primary-950 dark:text-primary-100">
                {editingTask ? "Edit Farm Task" : "Add Farm Task"}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-primary-400 hover:text-primary-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div>
              <label className="label">Task Title</label>
              <input
                required
                className="input"
                placeholder="e.g. Second dose of Urea / Light weeding"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Description (Optional)</label>
              <textarea
                className="input h-20 resize-none"
                placeholder="Specific guidance, dosage, or field notes"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Task Type</label>
                <select
                  className="input"
                  value={form.task_type}
                  onChange={(e) => setForm({ ...form, task_type: e.target.value })}
                >
                  <option value="custom">Custom</option>
                  <option value="irrigation">Irrigation</option>
                  <option value="fertilization">Fertilization</option>
                  <option value="inspection">Inspection</option>
                  <option value="soil">Soil</option>
                  <option value="harvest">Harvest</option>
                </select>
              </div>

              <div>
                <label className="label">Priority</label>
                <select
                  className="input"
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label">Scheduled Date</label>
              <input
                type="date"
                required
                className="input"
                value={form.scheduled_date}
                onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary text-xs">
                {editingTask ? "Update Task" : "Save Task"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function HealthTab({ cropId }: { cropId: string }) {
  const api = useApi();
  const [diagnoses, setDiagnoses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get<any[]>(`/crops/${cropId}/diagnoses`).then(setDiagnoses).finally(() => setLoading(false));
  }, [cropId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <CardSkeleton />;
  if (diagnoses.length === 0)
    return (
      <EmptyState
        title="No inspections yet"
        description="Take a photo with Crop Doctor to diagnose crop diseases, pest damage, or nutrient deficiencies."
        action={
          <Link href="/crop-doctor" className="btn-primary">
            Open Crop Doctor
          </Link>
        }
      />
    );

  return (
    <div className="card divide-y divide-primary-100 dark:divide-primary-900/40">
      {diagnoses.map((d) => (
        <div key={d.id} className="py-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-primary-900 dark:text-primary-100">
              {d.possible_condition || "No condition identified"}
            </p>
            <Badge
              variant={
                d.severity === "high"
                  ? "danger"
                  : d.severity === "medium"
                  ? "warning"
                  : "success"
              }
            >
              {d.severity}
            </Badge>
          </div>
          <p className="text-xs text-primary-400 mt-0.5">
            {formatDate(d.created_at)} • Confidence:{" "}
            {d.confidence_percentage !== null ? `${d.confidence_percentage}%` : "calibrated"}
          </p>
          {d.recommendation && (
            <p className="mt-1 text-sm text-primary-600 dark:text-primary-300">
              {d.recommendation}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function IrrigationTab({ cropId }: { cropId: string }) {
  const api = useApi();
  const [logs, setLogs] = useState<any[]>([]);
  const [advisory, setAdvisory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    method: "drip",
    duration_minutes: "45",
    water_amount_liters: "",
    notes: "",
  });

  function load() {
    setLoading(true);
    Promise.all([
      api.get<any[]>(`/crops/${cropId}/irrigation`),
      api.get<any>(`/crops/${cropId}/irrigation/next`).catch(() => null),
    ])
      .then(([l, a]) => {
        setLogs(l || []);
        setAdvisory(a);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, [cropId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAddLog(e: React.FormEvent) {
    e.preventDefault();
    await api.post(`/crops/${cropId}/irrigation`, {
      date: form.date,
      method: form.method,
      duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : null,
      water_amount_liters: form.water_amount_liters ? parseFloat(form.water_amount_liters) : null,
      notes: form.notes || null,
    });
    setShowModal(false);
    setForm({
      date: new Date().toISOString().slice(0, 10),
      method: "drip",
      duration_minutes: "45",
      water_amount_liters: "",
      notes: "",
    });
    load();
  }

  async function handleDelete(logId: string) {
    if (!confirm("Are you sure you want to delete this irrigation entry?")) return;
    await api.delete(`/crops/${cropId}/irrigation/${logId}`);
    load();
  }

  if (loading) return <CardSkeleton />;

  const latestLog = logs[0];

  return (
    <div className="space-y-4">
      {/* Action bar and Next Advisory */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-primary-950 dark:text-primary-100 flex items-center gap-2">
          <Droplets className="h-5 w-5 text-emerald-600" /> Irrigation Records & Advisory
        </h3>
        <button onClick={() => setShowModal(true)} className="btn-primary text-xs">
          <Plus className="h-4 w-4" /> Record Irrigation
        </button>
      </div>

      {/* Advisory and Summary Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="card bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold text-xs uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" /> Next Advisory Estimate
          </div>
          <p className="text-base font-bold text-primary-950 dark:text-primary-100 mt-1">
            {advisory?.next_date ? formatDate(advisory.next_date) : "Evaluation scheduled"}
          </p>
          <p className="text-xs text-primary-600 dark:text-primary-400 mt-0.5">
            {advisory?.note ||
              "Estimated interval derived from crop stage and weather conditions. Verify rainfall before watering."}
          </p>
        </div>

        <div className="card">
          <p className="text-xs font-semibold text-primary-500 uppercase tracking-wider">
            Last Irrigation Logged
          </p>
          {latestLog ? (
            <div className="mt-1">
              <p className="text-base font-bold text-primary-900 dark:text-primary-100">
                {formatDate(latestLog.date)} •{" "}
                <span className="capitalize">{latestLog.method}</span>
              </p>
              <p className="text-xs text-primary-500 mt-0.5">
                {latestLog.duration_minutes ? `${latestLog.duration_minutes} minutes` : "Duration not specified"}
                {latestLog.water_amount_liters ? ` • ${latestLog.water_amount_liters} Liters` : ""}
              </p>
            </div>
          ) : (
            <p className="text-sm text-primary-400 mt-1">No irrigation activity recorded yet.</p>
          )}
        </div>
      </div>

      {/* Logs Table */}
      {logs.length === 0 ? (
        <EmptyState
          title="No irrigation logged yet"
          description="Log irrigation events to track field water application and maintain accurate crop water balance."
          action={
            <button onClick={() => setShowModal(true)} className="btn-primary">
              <Plus className="h-4 w-4 mr-1" /> Log First Irrigation
            </button>
          }
        />
      ) : (
        <div className="card divide-y divide-primary-100 dark:divide-primary-900/40 p-0 overflow-hidden">
          <div className="bg-primary-50/70 dark:bg-primary-950/40 px-4 py-2.5 text-xs font-semibold text-primary-700 dark:text-primary-300 grid grid-cols-4 sm:grid-cols-5">
            <span>Date</span>
            <span>Method</span>
            <span>Duration</span>
            <span className="hidden sm:block">Notes</span>
            <span className="text-right">Action</span>
          </div>
          {logs.map((l) => (
            <div
              key={l.id}
              className="px-4 py-3 text-sm grid grid-cols-4 sm:grid-cols-5 items-center hover:bg-primary-50/30 transition"
            >
              <span className="font-medium text-primary-900 dark:text-primary-100">
                {formatDate(l.date)}
              </span>
              <span className="capitalize text-primary-700 dark:text-primary-300">
                <Badge variant="default">{l.method}</Badge>
              </span>
              <span className="text-primary-600 dark:text-primary-400 text-xs">
                {l.duration_minutes ? `${l.duration_minutes} min` : "—"}
                {l.water_amount_liters ? ` (${l.water_amount_liters}L)` : ""}
              </span>
              <span className="hidden sm:block text-xs text-primary-500 truncate">
                {l.notes || "—"}
              </span>
              <div className="text-right">
                <button
                  onClick={() => handleDelete(l.id)}
                  className="p-1 text-red-500 hover:text-red-700 transition"
                  title="Delete log"
                >
                  <Trash2 className="h-3.5 w-3.5 inline" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Record Irrigation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <form
            onSubmit={handleAddLog}
            className="w-full max-w-md rounded-xl bg-white dark:bg-[#1a2318] p-6 shadow-xl border border-primary-200 dark:border-primary-800 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-primary-100 pb-2">
              <h3 className="text-base font-semibold text-primary-950 dark:text-primary-100 flex items-center gap-2">
                <Droplets className="h-4 w-4 text-emerald-600" /> Record Irrigation Event
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-primary-400 hover:text-primary-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div>
              <label className="label">Irrigation Date</label>
              <input
                type="date"
                required
                className="input"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Method</label>
                <select
                  className="input"
                  value={form.method}
                  onChange={(e) => setForm({ ...form, method: e.target.value })}
                >
                  <option value="drip">Drip</option>
                  <option value="sprinkler">Sprinkler</option>
                  <option value="flood">Flood</option>
                  <option value="canal">Canal</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="label">Duration (Minutes)</label>
                <input
                  type="number"
                  min="1"
                  className="input"
                  placeholder="e.g. 45"
                  value={form.duration_minutes}
                  onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="label">Water Amount in Liters (Optional)</label>
              <input
                type="number"
                step="0.1"
                className="input"
                placeholder="e.g. 3500"
                value={form.water_amount_liters}
                onChange={(e) => setForm({ ...form, water_amount_liters: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Notes (Optional)</label>
              <textarea
                className="input h-16 resize-none"
                placeholder="e.g. Fertigation added / North quadrant"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary text-xs">
                Save Irrigation
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function SoilTab({ cropId }: { cropId: string }) {
  const api = useApi();
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    test_date: new Date().toISOString().slice(0, 10),
    ph: "6.8",
    nitrogen: "260",
    phosphorus: "18",
    potassium: "180",
    organic_carbon: "0.62",
    notes: "",
  });

  function load() {
    setLoading(true);
    api
      .get<any[]>(`/crops/${cropId}/soil-tests`)
      .then(setTests)
      .finally(() => setLoading(false));
  }
  useEffect(load, [cropId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAddTest(e: React.FormEvent) {
    e.preventDefault();
    await api.post(`/crops/${cropId}/soil-tests`, {
      test_date: form.test_date,
      ph: form.ph ? parseFloat(form.ph) : null,
      nitrogen: form.nitrogen ? parseFloat(form.nitrogen) : null,
      phosphorus: form.phosphorus ? parseFloat(form.phosphorus) : null,
      potassium: form.potassium ? parseFloat(form.potassium) : null,
      organic_carbon: form.organic_carbon ? parseFloat(form.organic_carbon) : null,
      notes: form.notes || null,
    });
    setShowModal(false);
    load();
  }

  async function handleDelete(testId: string) {
    if (!confirm("Are you sure you want to delete this soil test record?")) return;
    await api.delete(`/soil-tests/${testId}`);
    load();
  }

  if (loading) return <CardSkeleton />;

  const latestTest = tests[0];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-primary-950 dark:text-primary-100 flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-emerald-600" /> Soil Health & Nutrient Analysis
          </h3>
          <p className="text-xs text-primary-500 mt-0.5">
            Calibrated against verified Indian ICAR soil fertility reference standards.
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary text-xs">
          <Plus className="h-4 w-4" /> Add Soil Test
        </button>
      </div>

      {/* Latest Soil Test Display */}
      {latestTest ? (
        <div className="card space-y-4 border-primary-200 dark:border-primary-800">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-primary-100 dark:border-primary-900/40 pb-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Latest Soil Test
              </p>
              <p className="text-sm font-bold text-primary-950 dark:text-primary-100">
                Tested on {formatDate(latestTest.test.test_date)}
              </p>
            </div>
            {latestTest.test.notes && (
              <p className="text-xs text-primary-500 italic max-w-sm truncate">
                "{latestTest.test.notes}"
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {latestTest.assessments.map((a: any) => {
              const isNormal = a.rating === "Normal";
              const isLow = a.rating.includes("Low") || a.rating === "Low";
              const isHigh = a.rating.includes("High") || a.rating === "High";

              return (
                <div
                  key={a.parameter}
                  className="rounded-xl border border-primary-100 dark:border-primary-900/60 bg-primary-50/40 dark:bg-primary-950/20 p-3"
                >
                  <p className="text-xs font-medium text-primary-600 dark:text-primary-400">
                    {a.parameter}
                  </p>
                  <p className="text-lg font-bold text-primary-950 dark:text-primary-100 mt-0.5">
                    {a.value !== null ? a.value : "—"}
                    <span className="text-[10px] font-normal text-primary-500 ml-1">
                      {a.parameter === "pH"
                        ? ""
                        : a.parameter === "Organic Carbon"
                        ? "%"
                        : "kg/ha"}
                    </span>
                  </p>
                  <div className="mt-2">
                    <Badge variant={isNormal ? "success" : isLow ? "warning" : "danger"}>
                      {a.rating}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <EmptyState
          title="No soil test recorded"
          description="Record laboratory soil test results (pH, Nitrogen, Phosphorus, Potassium, Organic Carbon) to assess fertility and optimize fertilizer application."
          action={
            <button onClick={() => setShowModal(true)} className="btn-primary">
              <Plus className="h-4 w-4 mr-1" /> Add Soil Test
            </button>
          }
        />
      )}

      {/* History Section */}
      {tests.length > 1 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-primary-500">
            Previous Soil Tests ({tests.length})
          </h4>
          <div className="card divide-y divide-primary-100 dark:divide-primary-900/40 p-0">
            {tests.slice(1).map((t) => (
              <div
                key={t.test.id}
                className="px-4 py-3 flex items-center justify-between text-xs hover:bg-primary-50/40 transition"
              >
                <div>
                  <span className="font-semibold text-primary-900 dark:text-primary-100">
                    {formatDate(t.test.test_date)}
                  </span>
                  <span className="text-primary-500 ml-3">
                    pH: {t.test.ph ?? "—"} • N: {t.test.nitrogen ?? "—"} • P: {t.test.phosphorus ?? "—"} • K: {t.test.potassium ?? "—"}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(t.test.id)}
                  className="p-1 text-red-500 hover:text-red-700 transition"
                  title="Delete record"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Soil Test Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <form
            onSubmit={handleAddTest}
            className="w-full max-w-md rounded-xl bg-white dark:bg-[#1a2318] p-6 shadow-xl border border-primary-200 dark:border-primary-800 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-primary-100 pb-2">
              <h3 className="text-base font-semibold text-primary-950 dark:text-primary-100 flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-emerald-600" /> Record Soil Health Test
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-primary-400 hover:text-primary-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div>
              <label className="label">Sample / Test Date</label>
              <input
                type="date"
                required
                className="input"
                value={form.test_date}
                onChange={(e) => setForm({ ...form, test_date: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Soil pH (0 - 14)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="14"
                  required
                  placeholder="e.g. 6.8"
                  className="input"
                  value={form.ph}
                  onChange={(e) => setForm({ ...form, ph: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Organic Carbon (%)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="e.g. 0.65"
                  className="input"
                  value={form.organic_carbon}
                  onChange={(e) => setForm({ ...form, organic_carbon: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="label">Nitrogen (kg/ha)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 260"
                  className="input"
                  value={form.nitrogen}
                  onChange={(e) => setForm({ ...form, nitrogen: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Phosphorus (kg/ha)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 18"
                  className="input"
                  value={form.phosphorus}
                  onChange={(e) => setForm({ ...form, phosphorus: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Potassium (kg/ha)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 180"
                  className="input"
                  value={form.potassium}
                  onChange={(e) => setForm({ ...form, potassium: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="label">Laboratory / Testing Notes (Optional)</label>
              <textarea
                className="input h-16 resize-none"
                placeholder="e.g. Tested at Krishi Vigyan Kendra (KVK) lab"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary text-xs">
                Save Soil Test
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function ExpensesTab({ cropId, onRefresh }: { cropId: string; onRefresh?: () => void }) {
  const api = useApi();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("seeds");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [submittingAdd, setSubmittingAdd] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit State
  const [editingExpense, setEditingExpense] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    category: "seeds",
    amount: "",
    date: "",
    notes: "",
  });
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Delete State
  const [deletingExpense, setDeletingExpense] = useState<any | null>(null);
  const [submittingDelete, setSubmittingDelete] = useState(false);

  // Compact Actions Menu dropdown state
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  function load() {
    api
      .get<any[]>(`/crops/${cropId}/expenses`)
      .then((data) => setExpenses(data || []))
      .catch((e) => setError(e?.message || "Failed to load expenses."))
      .finally(() => setLoading(false));
  }
  useEffect(load, [cropId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close actions menu on click outside
  useEffect(() => {
    function handleClickOutside() {
      setMenuOpenId(null);
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  async function addExpense(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;
    setSubmittingAdd(true);
    setError(null);
    try {
      await api.post(`/crops/${cropId}/expenses`, {
        category,
        amount: parseFloat(amount),
        date,
        notes: notes.trim() || null,
      });
      setAmount("");
      setNotes("");
      load();
      onRefresh?.();
    } catch (err: any) {
      setError(err?.message || "Failed to record expense.");
    } finally {
      setSubmittingAdd(false);
    }
  }

  function startEdit(exp: any, e?: React.MouseEvent) {
    e?.stopPropagation();
    setMenuOpenId(null);
    setEditingExpense(exp);
    setEditForm({
      category: exp.category || "seeds",
      amount: String(exp.amount),
      date: exp.date || new Date().toISOString().slice(0, 10),
      notes: exp.notes || "",
    });
  }

  async function handleUpdateExpense(e: React.FormEvent) {
    e.preventDefault();
    if (!editingExpense || !editForm.amount) return;
    setSubmittingEdit(true);
    setError(null);
    try {
      await api.patch(`/expenses/${editingExpense.id}`, {
        category: editForm.category,
        amount: parseFloat(editForm.amount),
        date: editForm.date,
        notes: editForm.notes.trim() || null,
      });
      setEditingExpense(null);
      load();
      onRefresh?.();
    } catch (err: any) {
      setError(err?.message || "Failed to update expense.");
    } finally {
      setSubmittingEdit(false);
    }
  }

  function startDelete(exp: any, e?: React.MouseEvent) {
    e?.stopPropagation();
    setMenuOpenId(null);
    setDeletingExpense(exp);
  }

  async function handleConfirmDelete() {
    if (!deletingExpense) return;
    setSubmittingDelete(true);
    setError(null);
    try {
      await api.delete(`/expenses/${deletingExpense.id}`);
      setDeletingExpense(null);
      load();
      onRefresh?.();
    } catch (err: any) {
      setError(err?.message || "Failed to delete expense.");
    } finally {
      setSubmittingDelete(false);
    }
  }

  const categoryBadgeColors: Record<string, string> = {
    seeds: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    fertilizer: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    pesticides: "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
    labour: "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
    irrigation: "bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800",
    machinery: "bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
    transport: "bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800",
    other: "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  };

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);

  // Group by category for quick summary breakdown
  const categoryTotals = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
    return acc;
  }, {});

  if (loading) return <CardSkeleton />;

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Add Expense Form */}
      <form onSubmit={addExpense} className="card space-y-3">
        <h4 className="text-sm font-semibold text-primary-950 dark:text-primary-100">
          Log New Expense
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="label">Category</label>
            <select
              className="input capitalize"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {[
                "seeds",
                "fertilizer",
                "pesticides",
                "labour",
                "irrigation",
                "machinery",
                "transport",
                "other",
              ].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Amount (₹)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="e.g. 1500"
              className="input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Date</label>
            <input
              type="date"
              required
              className="input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Notes (Optional)</label>
            <input
              type="text"
              placeholder="e.g. 2 bags Urea, local shop"
              className="input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end pt-1">
          <button type="submit" disabled={submittingAdd} className="btn-primary text-xs">
            <Plus className="h-3.5 w-3.5" />
            {submittingAdd ? "Saving..." : "Add Expense"}
          </button>
        </div>
      </form>

      {/* Summary KPI & Category Breakdown */}
      <div className="card space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary-500">
              Total Recorded Crop Expenses
            </p>
            <p className="text-2xl font-bold text-primary-900 dark:text-primary-100 mt-0.5">
              {formatCurrencyINR(total)}
            </p>
          </div>
          <p className="text-xs text-primary-500">
            {expenses.length} {expenses.length === 1 ? "entry" : "entries"} recorded
          </p>
        </div>

        {Object.keys(categoryTotals).length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-primary-100 dark:border-primary-900/40">
            {Object.entries(categoryTotals).map(([cat, amt]) => (
              <span
                key={cat}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium capitalize",
                  categoryBadgeColors[cat] || categoryBadgeColors.other
                )}
              >
                <span>{cat}:</span>
                <span className="font-semibold">{formatCurrencyINR(amt)}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Expenses List */}
      <div>
        <h4 className="text-sm font-semibold text-primary-900 dark:text-primary-100 mb-2">
          Expense History ({expenses.length})
        </h4>

        {expenses.length === 0 ? (
          <EmptyState
            title="No expenses logged yet"
            description="Use the form above to record seeds, fertilizer, labour, or irrigation costs."
          />
        ) : (
          <div className="card divide-y divide-primary-100 dark:divide-primary-900/40 p-0 overflow-visible">
            {expenses.map((e) => {
              const badgeStyle = categoryBadgeColors[e.category] || categoryBadgeColors.other;
              const isMenuOpen = menuOpenId === e.id;

              return (
                <div
                  key={e.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-3.5 text-sm hover:bg-primary-50/50 dark:hover:bg-primary-900/20 transition rounded-xl relative"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span
                      className={cn(
                        "rounded-md border px-2 py-0.5 text-xs font-semibold uppercase tracking-wider shrink-0 mt-0.5",
                        badgeStyle
                      )}
                    >
                      {e.category}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-primary-900 dark:text-primary-100 truncate">
                        {e.notes || `${e.category.charAt(0).toUpperCase() + e.category.slice(1)} expense`}
                      </p>
                      <p className="text-xs text-primary-500 mt-0.5">{formatDate(e.date)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-bold text-base text-primary-950 dark:text-primary-100">
                      {formatCurrencyINR(Number(e.amount))}
                    </span>

                    {/* Compact Actions Menu [⋮] */}
                    <div className="relative" onClick={(ev) => ev.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setMenuOpenId(isMenuOpen ? null : e.id)}
                        className="rounded-lg p-1.5 text-primary-400 hover:text-primary-700 hover:bg-primary-100/60 dark:hover:bg-primary-800 dark:hover:text-primary-200 transition"
                        title="Actions"
                        aria-label="Actions menu"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>

                      {isMenuOpen && (
                        <div className="absolute right-0 top-full z-40 mt-1 w-32 rounded-xl border border-primary-100 dark:border-primary-800 bg-white dark:bg-[#1a2318] py-1 shadow-xl animate-in fade-in zoom-in-95">
                          <button
                            type="button"
                            onClick={(ev) => startEdit(e, ev)}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-medium text-primary-700 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/40 text-left transition"
                          >
                            <Pencil className="h-3.5 w-3.5 text-primary-500" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={(ev) => startDelete(e, ev)}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-left transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Expense Modal */}
      {editingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <form
            onSubmit={handleUpdateExpense}
            className="w-full max-w-md rounded-2xl bg-white dark:bg-[#1a2318] p-6 shadow-2xl border border-primary-200 dark:border-primary-800 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-primary-100 dark:border-primary-800 pb-3">
              <h3 className="text-base font-semibold text-primary-900 dark:text-primary-100">
                Edit Expense
              </h3>
              <button
                type="button"
                onClick={() => setEditingExpense(null)}
                className="text-primary-400 hover:text-primary-600 rounded-lg p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div>
              <label className="label">Category</label>
              <select
                className="input capitalize"
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
              >
                {[
                  "seeds",
                  "fertilizer",
                  "pesticides",
                  "labour",
                  "irrigation",
                  "machinery",
                  "transport",
                  "other",
                ].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  className="input"
                  value={editForm.amount}
                  onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Date</label>
                <input
                  type="date"
                  required
                  className="input"
                  value={editForm.date}
                  onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="label">Notes / Description</label>
              <input
                type="text"
                placeholder="Optional notes"
                className="input"
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-primary-100 dark:border-primary-800">
              <button
                type="button"
                onClick={() => setEditingExpense(null)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button type="submit" disabled={submittingEdit} className="btn-primary text-xs">
                {submittingEdit ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#1a2318] p-6 shadow-2xl border border-red-200 dark:border-red-900/60 space-y-4">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/60">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-primary-950 dark:text-primary-100">
                  Delete Expense?
                </h3>
                <p className="text-xs text-primary-500 capitalize">
                  {deletingExpense.category} • {formatDate(deletingExpense.date)}
                </p>
              </div>
            </div>

            <p className="text-xs text-primary-600 dark:text-primary-300 leading-relaxed">
              This will permanently remove{" "}
              <strong>{formatCurrencyINR(Number(deletingExpense.amount))}</strong> from recorded
              expenses for this crop and update related analytics and profit reports.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-primary-100 dark:border-primary-800">
              <button
                type="button"
                onClick={() => setDeletingExpense(null)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={submittingDelete}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition"
              >
                {submittingDelete ? "Deleting..." : "Delete Expense"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AnalyticsTab({ crop }: { crop: CropCycle }) {
  const api = useApi();
  const [report, setReport] = useState<any>(null);
  const [tasks, setTasks] = useState<CropTask[]>([]);
  const [irrigationLogs, setIrrigationLogs] = useState<any[]>([]);
  const [soilTests, setSoilTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    setError(null);
    Promise.all([
      api.get<any>(`/crops/${crop.id}/season-report`).catch(() => null),
      api.get<CropTask[]>(`/crops/${crop.id}/tasks`).catch(() => []),
      api.get<any[]>(`/crops/${crop.id}/irrigation`).catch(() => []),
      api.get<any[]>(`/crops/${crop.id}/soil-tests`).catch(() => []),
    ])
      .then(([rep, t, irr, s]) => {
        setReport(rep);
        setTasks(t || []);
        setIrrigationLogs(irr || []);
        setSoilTests(s || []);
      })
      .catch((e) => setError(e?.message || "Failed to load crop analytics."))
      .finally(() => setLoading(false));
  }

  useEffect(load, [crop.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <CardSkeleton />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const pendingTasks = tasks.filter((t) => t.status === "pending").length;

  const totalExpenses = report?.total_expenses || 0;
  const revenue = report?.revenue;
  const profit = report?.profit;
  const roi = report?.roi_percentage;
  const yieldQty = report?.yield_quantity;

  const hasData =
    totalExpenses > 0 ||
    revenue !== null ||
    irrigationLogs.length > 0 ||
    tasks.length > 0 ||
    soilTests.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-primary-100 dark:border-primary-900/40 pb-3">
        <div>
          <h3 className="text-base font-semibold text-primary-950 dark:text-primary-100">
            {crop.crop_name} Performance Analytics
          </h3>
          <p className="text-xs text-primary-500">
            {crop.season} {crop.year} • Sown on {formatDate(crop.sowing_date)}
            {report?.duration_days ? ` • ${report.duration_days} Days in Field` : ""}
          </p>
        </div>
        <Link
          href={`/analytics?crop_id=${crop.id}&farm_id=${crop.farm_id}`}
          className="btn-secondary text-xs inline-flex items-center gap-1.5"
        >
          View Full Farm Analytics <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="card">
          <p className="text-xs text-primary-500 uppercase tracking-wider font-semibold">Total Expenses</p>
          <p className="text-lg font-bold text-primary-900 dark:text-primary-100 mt-1">
            {formatCurrencyINR(totalExpenses)}
          </p>
          <p className="text-[11px] text-primary-400 mt-0.5">
            {totalExpenses > 0 ? "From logged expenses" : "No expenses recorded yet"}
          </p>
        </div>

        <div className="card">
          <p className="text-xs text-primary-500 uppercase tracking-wider font-semibold">Total Revenue</p>
          <p className="text-lg font-bold text-primary-900 dark:text-primary-100 mt-1">
            {revenue !== null && revenue !== undefined
              ? formatCurrencyINR(revenue)
              : "No sale yet"}
          </p>
          <p className="text-[11px] text-primary-400 mt-0.5">
            {yieldQty ? `Yield: ${yieldQty} quintals` : "Harvest not yet recorded"}
          </p>
        </div>

        <div className="card">
          <p className="text-xs text-primary-500 uppercase tracking-wider font-semibold">Net Profit / Loss</p>
          <p
            className={`text-lg font-bold mt-1 ${
              profit !== null && profit > 0
                ? "text-emerald-700 dark:text-emerald-400"
                : profit !== null && profit < 0
                ? "text-red-600"
                : "text-primary-900 dark:text-primary-100"
            }`}
          >
            {profit !== null && profit !== undefined ? formatCurrencyINR(profit) : "—"}
          </p>
          <p className="text-[11px] text-primary-400 mt-0.5">
            {roi !== null && roi !== undefined ? `ROI: ${roi}%` : "Awaiting harvest and sale"}
          </p>
        </div>

        <div className="card">
          <p className="text-xs text-primary-500 uppercase tracking-wider font-semibold">Field Tasks</p>
          <p className="text-lg font-bold text-primary-900 dark:text-primary-100 mt-1">
            {completedTasks}{" "}
            <span className="text-xs font-normal text-primary-400">/ {tasks.length}</span>
          </p>
          <p className="text-[11px] text-primary-400 mt-0.5">
            {pendingTasks > 0 ? `${pendingTasks} pending tasks` : "All tasks complete"}
          </p>
        </div>
      </div>

      {/* Activity Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Irrigation Activity */}
        <div className="card space-y-2">
          <div className="flex items-center gap-2 text-primary-700 dark:text-primary-300 font-semibold text-xs uppercase tracking-wider">
            <Droplets className="h-4 w-4 text-emerald-600" /> Irrigation Activity
          </div>
          <p className="text-2xl font-bold text-primary-950 dark:text-primary-100">
            {irrigationLogs.length}{" "}
            <span className="text-xs font-normal text-primary-500">events logged</span>
          </p>
          {irrigationLogs.length > 0 ? (
            <p className="text-xs text-primary-600 dark:text-primary-400">
              Last irrigation on {formatDate(irrigationLogs[0].date)} ({irrigationLogs[0].method})
            </p>
          ) : (
            <p className="text-xs text-primary-400 italic">No irrigation activity recorded yet.</p>
          )}
        </div>

        {/* Soil Health Status */}
        <div className="card space-y-2">
          <div className="flex items-center gap-2 text-primary-700 dark:text-primary-300 font-semibold text-xs uppercase tracking-wider">
            <FlaskConical className="h-4 w-4 text-emerald-600" /> Soil Health
          </div>
          {soilTests.length > 0 ? (
            <>
              <p className="text-2xl font-bold text-primary-950 dark:text-primary-100">
                pH {soilTests[0].test.ph ?? "—"}
              </p>
              <p className="text-xs text-primary-600 dark:text-primary-400">
                Tested on {formatDate(soilTests[0].test.test_date)} • {soilTests.length} tests in record
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-primary-400 mt-1">No soil test recorded.</p>
              <p className="text-xs text-primary-400">Record a test in the Soil tab to track nutrient levels.</p>
            </>
          )}
        </div>

        {/* Health Inspections */}
        <div className="card space-y-2">
          <div className="flex items-center gap-2 text-primary-700 dark:text-primary-300 font-semibold text-xs uppercase tracking-wider">
            <Sparkles className="h-4 w-4 text-emerald-600" /> Health Inspections
          </div>
          <p className="text-2xl font-bold text-primary-950 dark:text-primary-100">
            {report?.health_events || 0}{" "}
            <span className="text-xs font-normal text-primary-500">evaluations</span>
          </p>
          <p className="text-xs text-primary-600 dark:text-primary-400">
            {report?.health_events
              ? "Recorded via Crop Doctor"
              : "No crop health inspections recorded yet."}
          </p>
        </div>
      </div>

      {/* Empty State Banner if insufficient data */}
      {!hasData && (
        <div className="rounded-xl border border-primary-200 dark:border-primary-800 bg-primary-50/60 dark:bg-primary-950/20 p-5 text-center">
          <Info className="h-6 w-6 text-primary-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-primary-900 dark:text-primary-100">
            Record farm activities to unlock more crop insights.
          </p>
          <p className="text-xs text-primary-500 mt-1 max-w-md mx-auto">
            Log your irrigation events, soil test results, tasks, and expenses across the tabs above
            to see comprehensive ROI, yield, and agronomic performance data here.
          </p>
        </div>
      )}
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

  // Deletion modals state
  const [deletingHarvest, setDeletingHarvest] = useState<any | null>(null);
  const [deletingSale, setDeletingSale] = useState<any | null>(null);
  const [submittingDelete, setSubmittingDelete] = useState(false);

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
        setHarvests(h || []);
        setSalesSummary(s);
      })
      .catch((e) => setError(e?.message || "Failed to load harvest & sales data."))
      .finally(() => setLoading(false));
  }

  useEffect(load, [crop.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAddHarvest(e: React.FormEvent) {
    e.preventDefault();
    if (!harvestForm.yield_quantity || parseFloat(harvestForm.yield_quantity) <= 0) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.post(`/crops/${crop.id}/harvests`, {
        harvest_date: harvestForm.harvest_date,
        yield_quantity: parseFloat(harvestForm.yield_quantity),
        yield_unit: harvestForm.yield_unit,
      });
      setShowHarvestForm(false);
      setHarvestForm({
        harvest_date: new Date().toISOString().slice(0, 10),
        yield_quantity: "",
        yield_unit: "quintal",
      });
      load();
      onRefresh();
    } catch (e: any) {
      setError(e?.message || "Failed to record harvest.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRecordSale(e: React.FormEvent) {
    e.preventDefault();
    const qty = parseFloat(saleForm.quantity_sold);
    const price = parseFloat(saleForm.price_per_unit);
    if (!qty || qty <= 0 || !price || price <= 0) return;

    if (qty > remaining) {
      setError(`Quantity sold (${qty} ${unit}) cannot exceed remaining unsold harvest (${remaining} ${unit}).`);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await api.post(`/crops/${crop.id}/sales`, {
        sale_date: saleForm.sale_date,
        quantity_sold: qty,
        quantity_unit: saleForm.quantity_unit,
        price_per_unit: price,
        buyer_name: saleForm.buyer_name.trim() || null,
        notes: saleForm.notes.trim() || null,
      });
      setShowSaleForm(false);
      setSaleForm({
        sale_date: new Date().toISOString().slice(0, 10),
        quantity_sold: "",
        quantity_unit: "quintal",
        price_per_unit: "",
        buyer_name: "",
        notes: "",
      });
      load();
      onRefresh();
    } catch (e: any) {
      setError(e?.message || "Failed to record sale.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmDeleteHarvest() {
    if (!deletingHarvest) return;
    setSubmittingDelete(true);
    setError(null);
    try {
      await api.delete(`/crops/${crop.id}/harvests/${deletingHarvest.id}`);
      setDeletingHarvest(null);
      load();
      onRefresh();
    } catch (e: any) {
      setError(e?.message || "Failed to delete harvest record.");
    } finally {
      setSubmittingDelete(false);
    }
  }

  async function handleConfirmDeleteSale() {
    if (!deletingSale) return;
    setSubmittingDelete(true);
    setError(null);
    try {
      await api.delete(`/crops/${crop.id}/sales/${deletingSale.id}`);
      setDeletingSale(null);
      load();
      onRefresh();
    } catch (e: any) {
      setError(e?.message || "Failed to delete sale record.");
    } finally {
      setSubmittingDelete(false);
    }
  }

  if (loading) return <CardSkeleton />;

  const totalHarvested = harvests.reduce((acc, h) => acc + Number(h.yield_quantity), 0);
  const totalSold = salesSummary?.total_quantity_sold || 0;
  const remaining = Math.max(0, totalHarvested - totalSold);
  const totalRevenue = salesSummary?.total_sales_revenue || 0;
  const unit = harvests[0]?.yield_unit || "quintal";
  const salesList = salesSummary?.sales || [];
  const parsedSoldQty = parseFloat(saleForm.quantity_sold) || 0;
  const isOverSold = parsedSoldQty > remaining;

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Yield & Sales Summary Header */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-500">Crop Status</p>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider",
                crop.status === "active"
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : crop.status === "harvested"
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                  : crop.status === "sold"
                  ? "bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300"
                  : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
              )}
            >
              {crop.status}
            </span>
          </div>
          <p className="text-[11px] text-primary-400 mt-1">
            {crop.status === "sold"
              ? "All produce sold"
              : crop.status === "harvested"
              ? "Harvested, stock in hand"
              : "Standing crop in field"}
          </p>
        </div>

        <div className="card">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-500">Total Harvested</p>
          <p className="text-2xl font-bold text-primary-900 dark:text-primary-100 mt-1">
            {totalHarvested} <span className="text-sm font-normal text-primary-600">{unit}</span>
          </p>
          <p className="text-[11px] text-primary-400 mt-0.5">{harvests.length} harvest logs</p>
        </div>

        <div className="card">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-500">Remaining Unsold</p>
          <p
            className={cn(
              "text-2xl font-bold mt-1",
              remaining > 0
                ? "text-amber-700 dark:text-amber-400"
                : "text-primary-400 dark:text-primary-500"
            )}
          >
            {remaining} <span className="text-sm font-normal text-primary-600">{unit}</span>
          </p>
          <p className="text-[11px] text-primary-400 mt-0.5">
            {remaining > 0 ? "Available for sale" : totalHarvested > 0 ? "Fully sold out" : "No harvest yet"}
          </p>
        </div>

        <div className="card">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-500">Total Revenue</p>
          <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-400 mt-1">
            {formatCurrencyINR(totalRevenue)}
          </p>
          <p className="text-[11px] text-primary-400 mt-0.5">
            {totalSold} {unit} sold across {salesList.length} transactions
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-primary-100 dark:border-primary-900/40 pb-3">
        <h3 className="text-base font-semibold text-primary-950 dark:text-primary-100">
          Harvest Logs & Produce Sales
        </h3>
        <div className="flex gap-2">
          <button onClick={() => setShowHarvestForm((s) => !s)} className="btn-secondary text-xs">
            + Log Harvest
          </button>
          {totalHarvested > 0 && remaining > 0 && (
            <button
              onClick={() => {
                setSaleForm({ ...saleForm, quantity_unit: unit });
                setShowSaleForm(true);
              }}
              className="btn-primary text-xs"
            >
              Record Sale
            </button>
          )}
        </div>
      </div>

      {/* Harvest Form */}
      {showHarvestForm && (
        <form onSubmit={handleAddHarvest} className="card space-y-3">
          <h4 className="font-semibold text-primary-900 dark:text-primary-100 text-sm">Record Crop Harvest</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="label">Harvest Date</label>
              <input
                type="date"
                required
                className="input"
                value={harvestForm.harvest_date}
                onChange={(e) => setHarvestForm({ ...harvestForm, harvest_date: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Yield Quantity</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="e.g. 45"
                className="input"
                value={harvestForm.yield_quantity}
                onChange={(e) => setHarvestForm({ ...harvestForm, yield_quantity: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Unit</label>
              <select
                className="input"
                value={harvestForm.yield_unit}
                onChange={(e) => setHarvestForm({ ...harvestForm, yield_unit: e.target.value })}
              >
                <option value="quintal">quintal</option>
                <option value="kg">kg</option>
                <option value="tonne">tonne</option>
                <option value="bag">bag</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowHarvestForm(false)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button disabled={submitting} className="btn-primary text-xs">
              {submitting ? "Saving..." : "Save Harvest"}
            </button>
          </div>
        </form>
      )}

      {/* Harvests List */}
      <div>
        <h4 className="text-sm font-semibold text-primary-900 dark:text-primary-100 mb-2">
          Recorded Harvests ({harvests.length})
        </h4>
        {harvests.length === 0 ? (
          <EmptyState
            title="No harvest recorded"
            description="When this crop is harvested, click Log Harvest above."
          />
        ) : (
          <div className="card divide-y divide-primary-100 dark:divide-primary-900/40 p-0">
            {harvests.map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between p-3.5 text-sm hover:bg-primary-50/50 dark:hover:bg-primary-900/20 transition rounded-xl"
              >
                <div>
                  <p className="font-semibold text-primary-900 dark:text-primary-100">
                    Harvested {h.yield_quantity} {h.yield_unit}
                  </p>
                  <p className="text-xs text-primary-500 mt-0.5">Date: {formatDate(h.harvest_date)}</p>
                </div>
                <div className="flex items-center gap-3">
                  {h.revenue && (
                    <p className="text-xs text-primary-600 dark:text-primary-400">
                      Estimated Value: {formatCurrencyINR(h.revenue)}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => setDeletingHarvest(h)}
                    className="rounded-lg p-1.5 text-primary-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                    title="Delete Harvest Record"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sales List */}
      <div>
        <h4 className="text-sm font-semibold text-primary-900 dark:text-primary-100 mb-2">
          Recorded Produce Sales ({salesList.length})
        </h4>
        {salesList.length === 0 ? (
          <EmptyState
            title="No sales recorded yet"
            description="Record produce sales to track actual revenue and profit."
          />
        ) : (
          <div className="card divide-y divide-primary-100 dark:divide-primary-900/40 p-0">
            {salesList.map((s: any) => (
              <div
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-3 p-3.5 text-sm hover:bg-primary-50/50 dark:hover:bg-primary-900/20 transition rounded-xl"
              >
                <div>
                  <p className="font-semibold text-primary-900 dark:text-primary-100">
                    Sold {s.quantity_sold} {s.quantity_unit} @ {formatCurrencyINR(s.price_per_unit)}/
                    {s.quantity_unit}
                  </p>
                  <p className="text-xs text-primary-500 mt-0.5">
                    Date: {formatDate(s.sale_date)} {s.buyer_name && `• Buyer: ${s.buyer_name}`}
                  </p>
                  {s.notes && <p className="text-xs text-primary-400 mt-0.5">{s.notes}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-bold text-base text-emerald-800 dark:text-emerald-400">
                      {formatCurrencyINR(s.total_sale_value)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeletingSale(s)}
                    className="rounded-lg p-1.5 text-primary-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                    title="Delete Sale Record"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Record Sale Modal */}
      {showSaleForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <form
            onSubmit={handleRecordSale}
            className="w-full max-w-md rounded-2xl bg-white dark:bg-[#1a2318] p-6 shadow-2xl border border-primary-200 dark:border-primary-800 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-primary-100 dark:border-primary-800 pb-3">
              <h3 className="text-base font-semibold text-primary-900 dark:text-primary-100">Record Produce Sale</h3>
              <button
                type="button"
                onClick={() => setShowSaleForm(false)}
                className="text-primary-400 hover:text-primary-600 rounded-lg p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 p-3 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200">
              Remaining unsold harvest: <strong>{remaining} {unit}</strong>
            </div>

            {isOverSold && (
              <div className="rounded-xl bg-red-50 dark:bg-red-950/40 p-3 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
                Quantity sold ({parsedSoldQty} {unit}) exceeds available stock ({remaining} {unit}).
              </div>
            )}

            <div>
              <label className="label">Sale Date</label>
              <input
                type="date"
                required
                className="input"
                value={saleForm.sale_date}
                onChange={(e) => setSaleForm({ ...saleForm, sale_date: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Quantity Sold</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={remaining > 0 ? remaining : undefined}
                  required
                  placeholder={`Max ${remaining}`}
                  className="input"
                  value={saleForm.quantity_sold}
                  onChange={(e) => setSaleForm({ ...saleForm, quantity_sold: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Unit</label>
                <input className="input bg-primary-50 dark:bg-primary-950/40" readOnly value={unit} />
              </div>
            </div>
            <div>
              <label className="label">Price per {unit} (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                className="input"
                placeholder="e.g. 2150"
                value={saleForm.price_per_unit}
                onChange={(e) => setSaleForm({ ...saleForm, price_per_unit: e.target.value })}
              />
            </div>
            {saleForm.quantity_sold && saleForm.price_per_unit && !isOverSold && (
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 p-3 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-300">
                Total Calculated Revenue:{" "}
                <strong>
                  {formatCurrencyINR(
                    parseFloat(saleForm.quantity_sold) * parseFloat(saleForm.price_per_unit)
                  )}
                </strong>
              </div>
            )}
            <div>
              <label className="label">Buyer / Market Name (Optional)</label>
              <input
                className="input"
                placeholder="e.g. Local Mandi Trader / Co-op Society"
                value={saleForm.buyer_name}
                onChange={(e) => setSaleForm({ ...saleForm, buyer_name: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Notes (Optional)</label>
              <input
                className="input"
                placeholder="e.g. Payment received via UPI, Grade A quality"
                value={saleForm.notes}
                onChange={(e) => setSaleForm({ ...saleForm, notes: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-primary-100 dark:border-primary-800">
              <button
                type="button"
                onClick={() => setShowSaleForm(false)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                disabled={submitting || isOverSold || !saleForm.quantity_sold || !saleForm.price_per_unit}
                className="btn-primary text-xs"
              >
                {submitting ? "Saving..." : "Record Sale"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Harvest Confirmation Modal */}
      {deletingHarvest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#1a2318] p-6 shadow-2xl border border-red-200 dark:border-red-900/60 space-y-4">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/60">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-primary-950 dark:text-primary-100">
                  Delete Harvest Log?
                </h3>
                <p className="text-xs text-primary-500">
                  {formatDate(deletingHarvest.harvest_date)}
                </p>
              </div>
            </div>

            <p className="text-xs text-primary-600 dark:text-primary-300 leading-relaxed">
              Are you sure you want to delete this harvest record of{" "}
              <strong>
                {deletingHarvest.yield_quantity} {deletingHarvest.yield_unit}
              </strong>
              ? This will reduce total harvested inventory and update the crop status.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-primary-100 dark:border-primary-800">
              <button
                type="button"
                onClick={() => setDeletingHarvest(null)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteHarvest}
                disabled={submittingDelete}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition"
              >
                {submittingDelete ? "Deleting..." : "Delete Harvest"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Sale Confirmation Modal */}
      {deletingSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#1a2318] p-6 shadow-2xl border border-red-200 dark:border-red-900/60 space-y-4">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/60">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-primary-950 dark:text-primary-100">
                  Delete Sale Record?
                </h3>
                <p className="text-xs text-primary-500">
                  {formatDate(deletingSale.sale_date)}
                </p>
              </div>
            </div>

            <p className="text-xs text-primary-600 dark:text-primary-300 leading-relaxed">
              Are you sure you want to delete the sale of{" "}
              <strong>
                {deletingSale.quantity_sold} {deletingSale.quantity_unit}
              </strong>{" "}
              for{" "}
              <strong>{formatCurrencyINR(deletingSale.total_sale_value)}</strong>? This will restore
              the unsold produce to stock and update total revenue.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-primary-100 dark:border-primary-800">
              <button
                type="button"
                onClick={() => setDeletingSale(null)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSale}
                disabled={submittingDelete}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition"
              >
                {submittingDelete ? "Deleting..." : "Delete Sale"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CropDetailContent() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") || "overview";

  const api = useApi();
  const [crop, setCrop] = useState<CropCycle | null>(null);
  const [lifecycle, setLifecycle] = useState<Lifecycle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    setError(null);
    Promise.all([
      api.get<CropCycle>(`/crops/${id}`),
      api.get<Lifecycle>(`/crops/${id}/lifecycle`),
    ])
      .then(([c, l]) => {
        setCrop(c);
        setLifecycle(l);
      })
      .catch((e) => setError(e.message || "Could not load this crop."))
      .finally(() => setLoading(false));
  }
  useEffect(load, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <CardSkeleton />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!crop) return null;

  return (
    <Tabs
      defaultTab={defaultTab}
      tabs={[
        { id: "overview", label: "Overview", content: <OverviewTab crop={crop} lifecycle={lifecycle} /> },
        { id: "timeline", label: "Timeline", content: <TimelineTab lifecycle={lifecycle} /> },
        { id: "tasks", label: "Tasks", content: <TasksTab cropId={crop.id} /> },
        { id: "health", label: "Health", content: <HealthTab cropId={crop.id} /> },
        { id: "irrigation", label: "Irrigation", content: <IrrigationTab cropId={crop.id} /> },
        { id: "soil", label: "Soil", content: <SoilTab cropId={crop.id} /> },
        { id: "expenses", label: "Expenses", content: <ExpensesTab cropId={crop.id} onRefresh={load} /> },
        { id: "harvest", label: "Harvest & Sales", content: <HarvestSalesTab crop={crop} onRefresh={load} /> },
        { id: "analytics", label: "Analytics", content: <AnalyticsTab crop={crop} /> },
      ]}
    />
  );
}

export default function CropDetailPage() {
  return (
    <Suspense fallback={<CardSkeleton />}>
      <CropDetailContent />
    </Suspense>
  );
}
