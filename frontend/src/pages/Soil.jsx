import React, { useState, useEffect, useCallback } from "react";
import {
  FlaskConical,
  Calendar,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Info,
  Layers,
  Sprout,
  Tractor,
} from "lucide-react";
import { useFarms } from "../contexts/FarmContext";
import { useTranslation } from "../contexts/LanguageContext";
import soilApi from "../api/soil";
import PageHeader from "../components/common/PageHeader";
import MetricCard from "../components/common/MetricCard";
import Badge from "../components/common/Badge";
import EmptyState from "../components/common/EmptyState";
import Skeleton from "../components/common/Skeleton";
import Modal from "../components/common/Modal";
import ConfirmDialog from "../components/common/ConfirmDialog";
import { formatDate } from "../utils/formatters";

export default function Soil() {
  const { t } = useTranslation();
  const { selectedFarm, selectFarm, farms, selectedCrop, selectCrop, crops } = useFarms();

  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [form, setForm] = useState({
    test_date: new Date().toISOString().slice(0, 10),
    ph: 6.8,
    nitrogen: 280,
    phosphorus: 22,
    potassium: 190,
    organic_carbon: 0.65,
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  const loadData = useCallback(async () => {
    if (!selectedFarm?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      let data = [];
      if (selectedCrop?.id) {
        data = await soilApi.listByCrop(selectedCrop.id);
      } else {
        data = await soilApi.listByFarm(selectedFarm.id);
      }
      setTests(Array.isArray(data) ? data : []);
    } catch {
      setTests([]);
    } finally {
      setLoading(false);
    }
  }, [selectedFarm?.id, selectedCrop?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        test_date: form.test_date,
        ph: parseFloat(form.ph),
        nitrogen: parseFloat(form.nitrogen),
        phosphorus: parseFloat(form.phosphorus),
        potassium: parseFloat(form.potassium),
        organic_carbon: parseFloat(form.organic_carbon),
        notes: form.notes || null,
      };

      if (selectedCrop?.id) {
        await soilApi.createForCrop(selectedCrop.id, payload);
      } else {
        await soilApi.createForFarm(selectedFarm.id, payload);
      }

      setModalOpen(false);
      loadData();
    } catch (err) {
      setFormError(err?.message || "Failed to record soil assessment.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await soilApi.delete(deleteTarget.test?.id || deleteTarget.id);
      setTests((prev) => prev.filter((t) => (t.test?.id || t.id) !== (deleteTarget.test?.id || deleteTarget.id)));
      setDeleteTarget(null);
    } catch (err) {
      alert("Failed to delete soil test: " + err.message);
    }
  };

  const latestAssessment = tests[0] || null;
  const latestTest = latestAssessment?.test || latestAssessment;
  const assessments = latestAssessment?.assessments || [];

  const getRatingBadgeVariant = (rating) => {
    const r = (rating || "").toLowerCase();
    if (r.includes("optimum") || r.includes("normal") || r.includes("good") || r.includes("sufficient")) return "success";
    if (r.includes("medium") || r.includes("moderate")) return "warning";
    return "error";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <PageHeader
            title={t("soil.title", "Soil Health & Nutrient Benchmarks")}
            subtitle="Laboratory soil test telemetry, ICAR nutrient grading, pH levels, and organic carbon index."
          />
        </div>

        <button onClick={() => setModalOpen(true)} className="btn-primary text-xs">
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Soil Test
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : !latestAssessment ? (
        <EmptyState
          icon={FlaskConical}
          title="No soil test recorded"
          description="Log laboratory or field test kit results for nitrogen, phosphorus, potassium, and pH to get tailored fertilizer recommendations."
          actionLabel="Record Soil Test"
          onAction={() => setModalOpen(true)}
        />
      ) : (
        <>
          {/* Latest Soil Test Summary Hero */}
          <div className="card space-y-4 bg-gradient-to-br from-white to-primary-50/40 dark:from-slate-900 dark:to-primary-950/20">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-primary-700 dark:text-primary-300">
                  Latest Field Soil Report
                </span>
                <p className="text-xs text-slate-500">
                  Sample Tested on: <span className="font-semibold text-slate-800 dark:text-slate-200">{formatDate(latestTest?.test_date)}</span>
                </p>
              </div>

              {selectedFarm?.soil_type && (
                <Badge variant="neutral">
                  Texture: {selectedFarm.soil_type}
                </Badge>
              )}
            </div>

            {/* Nutrient Parameter Cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400">Soil pH</span>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{latestTest?.ph}</p>
                <div className="mt-1">
                  <Badge variant={latestTest?.ph >= 6.0 && latestTest?.ph <= 7.5 ? "success" : "warning"} className="text-[10px]">
                    {latestTest?.ph >= 6.0 && latestTest?.ph <= 7.5 ? "Neutral / Ideal" : latestTest?.ph < 6.0 ? "Acidic" : "Alkaline"}
                  </Badge>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400">Nitrogen (N)</span>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{latestTest?.nitrogen} <span className="text-xs font-normal">kg/ha</span></p>
                <div className="mt-1">
                  <Badge variant={getRatingBadgeVariant(assessments.find((a) => a.parameter === "Nitrogen")?.rating)} className="text-[10px]">
                    {assessments.find((a) => a.parameter === "Nitrogen")?.rating || "Standard"}
                  </Badge>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400">Phosphorus (P)</span>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{latestTest?.phosphorus} <span className="text-xs font-normal">kg/ha</span></p>
                <div className="mt-1">
                  <Badge variant={getRatingBadgeVariant(assessments.find((a) => a.parameter === "Phosphorus")?.rating)} className="text-[10px]">
                    {assessments.find((a) => a.parameter === "Phosphorus")?.rating || "Standard"}
                  </Badge>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400">Potassium (K)</span>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{latestTest?.potassium} <span className="text-xs font-normal">kg/ha</span></p>
                <div className="mt-1">
                  <Badge variant={getRatingBadgeVariant(assessments.find((a) => a.parameter === "Potassium")?.rating)} className="text-[10px]">
                    {assessments.find((a) => a.parameter === "Potassium")?.rating || "Standard"}
                  </Badge>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400">Organic Carbon</span>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{latestTest?.organic_carbon}%</p>
                <div className="mt-1">
                  <Badge variant={getRatingBadgeVariant(assessments.find((a) => a.parameter === "Organic Carbon")?.rating)} className="text-[10px]">
                    {assessments.find((a) => a.parameter === "Organic Carbon")?.rating || "Medium"}
                  </Badge>
                </div>
              </div>
            </div>

            {latestTest?.notes && (
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Agronomist Note: {latestTest.notes}
              </p>
            )}
          </div>

          {/* Test History List */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Historical Soil Tests</h3>
            <div className="card p-0 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Test Date</th>
                    <th className="px-4 py-3 font-semibold">pH</th>
                    <th className="px-4 py-3 font-semibold">Nitrogen (kg/ha)</th>
                    <th className="px-4 py-3 font-semibold">Phosphorus (kg/ha)</th>
                    <th className="px-4 py-3 font-semibold">Potassium (kg/ha)</th>
                    <th className="px-4 py-3 font-semibold">Organic Carbon</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {tests.map((item, idx) => {
                    const tData = item.test || item;
                    return (
                      <tr key={idx} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                          {formatDate(tData.test_date)}
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{tData.ph}</td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{tData.nitrogen}</td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{tData.phosphorus}</td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{tData.potassium}</td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{tData.organic_carbon}%</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setDeleteTarget(item)}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Add Soil Test Modal */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Record Soil Test Results"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-400">
                {formError}
              </div>
            )}

            <div>
              <label className="label">Test Date</label>
              <input
                required
                type="date"
                value={form.test_date}
                onChange={(e) => setForm({ ...form, test_date: e.target.value })}
                className="input text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Soil pH (0 - 14)</label>
                <input
                  required
                  type="number"
                  step="0.1"
                  min="3"
                  max="11"
                  value={form.ph}
                  onChange={(e) => setForm({ ...form, ph: e.target.value })}
                  className="input text-xs"
                />
              </div>

              <div>
                <label className="label">Organic Carbon (%)</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  max="5"
                  value={form.organic_carbon}
                  onChange={(e) => setForm({ ...form, organic_carbon: e.target.value })}
                  className="input text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">Nitrogen (kg/ha)</label>
                <input
                  required
                  type="number"
                  step="1"
                  value={form.nitrogen}
                  onChange={(e) => setForm({ ...form, nitrogen: e.target.value })}
                  className="input text-xs"
                />
              </div>

              <div>
                <label className="label">Phosphorus (kg/ha)</label>
                <input
                  required
                  type="number"
                  step="1"
                  value={form.phosphorus}
                  onChange={(e) => setForm({ ...form, phosphorus: e.target.value })}
                  className="input text-xs"
                />
              </div>

              <div>
                <label className="label">Potassium (kg/ha)</label>
                <input
                  required
                  type="number"
                  step="1"
                  value={form.potassium}
                  onChange={(e) => setForm({ ...form, potassium: e.target.value })}
                  className="input text-xs"
                />
              </div>
            </div>

            <div>
              <label className="label">Laboratory or Sample Notes (optional)</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="e.g. Sample collected from North parcel after wheat harvest"
                rows={2}
                className="input resize-none text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary text-xs"
              >
                {saving ? "Saving..." : "Save Soil Report"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Soil Test"
        message="Are you sure you want to delete this soil test record?"
        confirmText="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
