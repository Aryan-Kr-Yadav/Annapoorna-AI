"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useApi } from "@/lib/api-client";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/lib/utils";
import { Sprout, Plus, Trash2, AlertTriangle } from "lucide-react";
import type { Farm, CropCycle } from "@/lib/types";

const SEASONS = ["kharif", "rabi", "zaid"];

export default function FarmDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const api = useApi();
  const [farm, setFarm] = useState<Farm | null>(null);
  const [crops, setCrops] = useState<CropCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    crop_name: "", variety: "", season: "kharif", year: new Date().getFullYear(),
    sowing_date: new Date().toISOString().slice(0, 10), expected_harvest_date: "",
  });

  function load() {
    setLoading(true);
    setError(null);
    Promise.all([api.get<Farm>(`/farms/${id}`), api.get<CropCycle[]>(`/farms/${id}/crops`)])
      .then(([f, c]) => { setFarm(f); setCrops(c); })
      .catch((e) => setError(e.message || "Could not load this farm."))
      .finally(() => setLoading(false));
  }

  useEffect(load, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function addCrop(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/farms/${id}/crops`, { ...form, expected_harvest_date: form.expected_harvest_date || null });
      setShowForm(false);
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteFarm() {
    setDeleting(true);
    try {
      await api.delete(`/farms/${id}`);
      setShowDeleteModal(false);
      router.push("/farms");
    } catch (e: any) {
      setError(e.message || "Could not delete farm.");
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <CardSkeleton />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!farm) return null;

  const active = crops.filter((c) => c.status === "active");
  const past = crops.filter((c) => c.status !== "active");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary-900">{farm.name}</h1>
          <p className="text-sm text-primary-600">{farm.district}, {farm.state} • {farm.area} {farm.area_unit} • {farm.soil_type || "Soil type not set"}</p>
        </div>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete Farm
        </button>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-primary-900">Active crops</h2>
        <button onClick={() => setShowForm((s) => !s)} className="btn-secondary"><Plus className="h-4 w-4" /> Add crop</button>
      </div>

      {showForm && (
        <form onSubmit={addCrop} className="card space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Crop name</label><input required className="input" value={form.crop_name} onChange={(e) => setForm({ ...form, crop_name: e.target.value })} /></div>
            <div><label className="label">Variety</label><input className="input" value={form.variety} onChange={(e) => setForm({ ...form, variety: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Season</label>
              <select className="input" value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })}>
                {SEASONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div><label className="label">Year</label><input required type="number" className="input" value={form.year} onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) })} /></div>
          </div>
          <div><label className="label">Sowing date</label><input required type="date" className="input" value={form.sowing_date} onChange={(e) => setForm({ ...form, sowing_date: e.target.value })} /></div>
          <button disabled={saving} className="btn-primary">{saving ? "Saving..." : "Create crop cycle"}</button>
        </form>
      )}

      {active.length === 0 ? (
        <EmptyState icon={Sprout} title="No active crop" description="Add a crop cycle to start tracking it." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {active.map((c) => (
            <Link key={c.id} href={`/crops/${c.id}`} className="card hover:border-primary-300">
              <p className="font-medium text-primary-900">{c.crop_name}</p>
              <p className="text-sm text-primary-600">{c.season} {c.year}</p>
              <p className="mt-1 text-xs text-primary-500">Sown {formatDate(c.sowing_date)}</p>
            </Link>
          ))}
        </div>
      )}

      {past.length > 0 && (
        <>
          <h2 className="text-lg font-medium text-primary-900">Past crops</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {past.map((c) => (
              <Link key={c.id} href={`/crops/${c.id}`} className="card hover:border-primary-300">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-primary-900">{c.crop_name}</p>
                  <Badge variant={c.status === "harvested" ? "success" : "default"}>{c.status}</Badge>
                </div>
                <p className="text-sm text-primary-600">{c.season} {c.year}</p>
              </Link>
            ))}
          </div>
        </>
      )}

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Farm">
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg bg-red-50 p-3 text-red-800 text-sm">
            <AlertTriangle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
            <div>
              <p className="font-medium">Are you sure you want to delete &quot;{farm.name}&quot;?</p>
              <p className="text-xs text-red-600 mt-1">
                This will remove the farm and archive its associated crop cycles, tasks, irrigation logs, soil tests, and expense history.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowDeleteModal(false)} className="btn-secondary">Cancel</button>
            <button
              onClick={handleDeleteFarm}
              disabled={deleting}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Yes, Delete Farm"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
