import React, { useState, useEffect, useCallback } from "react";
import {
  Droplets,
  Calendar,
  Clock,
  Plus,
  Trash2,
  AlertTriangle,
  Info,
  CheckCircle2,
  Tractor,
  Sprout,
  Wind,
} from "lucide-react";
import { useFarms } from "../contexts/FarmContext";
import { useTranslation } from "../contexts/LanguageContext";
import irrigationApi from "../api/irrigation";
import farmsApi from "../api/farms";
import PageHeader from "../components/common/PageHeader";
import MetricCard from "../components/common/MetricCard";
import EmptyState from "../components/common/EmptyState";
import Skeleton from "../components/common/Skeleton";
import ConfirmDialog from "../components/common/ConfirmDialog";
import IrrigationFormModal from "../components/crops/IrrigationFormModal";
import { formatDate } from "../utils/formatters";

export default function Irrigation() {
  const { t } = useTranslation();
  const { selectedFarm, selectFarm, farms, selectedCrop, selectCrop, crops } = useFarms();

  const [logs, setLogs] = useState([]);
  const [advisory, setAdvisory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadData = useCallback(async () => {
    if (!selectedFarm?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      if (selectedCrop?.id) {
        const [lData, advData] = await Promise.all([
          irrigationApi.listByCrop(selectedCrop.id),
          irrigationApi.getNextEstimate(selectedCrop.id).catch(() => null),
        ]);
        setLogs(Array.isArray(lData) ? lData : []);
        setAdvisory(advData);
      } else {
        const lData = await irrigationApi.listByFarm(selectedFarm.id);
        setLogs(Array.isArray(lData) ? lData : []);
        setAdvisory(null);
      }
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [selectedFarm?.id, selectedCrop?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async () => {
    if (!deleteTarget || !selectedCrop?.id) return;
    try {
      await irrigationApi.delete(selectedCrop.id, deleteTarget.id);
      setLogs((prev) => prev.filter((l) => l.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      alert("Failed to delete irrigation log: " + err.message);
    }
  };

  const lastIrrigation = logs[0] || null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <PageHeader
            title={t("irrigation.title", "Irrigation & Soil Water Management")}
            subtitle="Monitor field hydration events, next watering schedules, and water volume logs."
          />
        </div>

        <button
          onClick={() => setModalOpen(true)}
          disabled={crops.length === 0}
          className="btn-primary text-xs"
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Log Irrigation Event
        </button>
      </div>

      {/* Advisory & Status Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card space-y-1">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Last Irrigation Event
          </span>
          <p className="text-xl font-bold text-slate-900 dark:text-white">
            {lastIrrigation ? formatDate(lastIrrigation.date) : "No log on record"}
          </p>
          {lastIrrigation && (
            <p className="text-xs text-slate-500">
              {lastIrrigation.method || "Flood"} • {lastIrrigation.duration_minutes || "—"} mins
            </p>
          )}
        </div>

        <div className="card space-y-1 bg-gradient-to-br from-sky-50 to-primary-50/30 dark:from-sky-950/20 dark:to-primary-950/20">
          <span className="text-xs font-semibold text-sky-700 dark:text-sky-300">
            Next Irrigation Advisory
          </span>
          <p className="text-xl font-bold text-slate-900 dark:text-white">
            {advisory?.next_irrigation_date ? formatDate(advisory.next_irrigation_date) : "Check Topsoil"}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {advisory?.message || "Ensure adequate rootzone moisture during vegetative & grain filling stages."}
          </p>
        </div>

        <div className="card space-y-1">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Total Water Sessions Logged
          </span>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{logs.length}</p>
          <p className="text-xs text-slate-500">
            Across {selectedCrop ? selectedCrop.crop_name : "all active parcel crops"}
          </p>
        </div>
      </div>

      {/* History Log */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Irrigation History Records
          </h3>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-500">Crop Scope:</span>
            <select
              value={selectedCrop?.id || ""}
              onChange={(e) => selectCrop(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 dark:border-[#1e3627] dark:bg-[#121c15] dark:text-stone-100"
            >
              <option value="">All Farm Crops</option>
              {crops.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.crop_name} ({c.season})
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : logs.length === 0 ? (
          <EmptyState
            icon={Droplets}
            title="No irrigation events recorded"
            description="Start logging your watering events to receive predictive rootzone moisture advisories."
            actionLabel="Log Irrigation"
            onAction={() => setModalOpen(true)}
          />
        ) : (
          <div className="card divide-y divide-slate-100 dark:divide-slate-800 p-0 overflow-hidden">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-4 transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
                    <Droplets className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold capitalize text-slate-900 dark:text-white">
                      {log.method || "Drip"} Irrigation
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>{formatDate(log.date)}</span>
                      {log.duration_minutes && <span>• Duration: {log.duration_minutes} min</span>}
                      {log.water_amount_liters && <span>• Vol: {log.water_amount_liters} L</span>}
                    </div>
                    {log.notes && (
                      <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">{log.notes}</p>
                    )}
                  </div>
                </div>

                {selectedCrop && (
                  <button
                    onClick={() => setDeleteTarget(log)}
                    className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <IrrigationFormModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          cropId={selectedCrop?.id || crops[0]?.id}
          onSaved={loadData}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Irrigation Record"
        message="Are you sure you want to delete this recorded watering event?"
        confirmText="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
