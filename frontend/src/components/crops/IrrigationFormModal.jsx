import React, { useState } from "react";
import { Modal } from "../common/Modal";
import cropsApi from "../../api/crops";

const METHODS = [
  { value: "drip", label: "Drip Irrigation" },
  { value: "sprinkler", label: "Sprinkler Irrigation" },
  { value: "flood", label: "Flood / Furrow Irrigation" },
  { value: "canal", label: "Canal Gravity Flow" },
  { value: "other", label: "Other Method" },
];

export function IrrigationFormModal({
  open = false,
  isOpen = false,
  onClose = () => {},
  onSubmit,
  onSaved,
  cropId,
  cropName = "",
  loading: externalLoading = false,
}) {
  const isModalOpen = open || isOpen;

  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    method: "drip",
    duration_minutes: 45,
    water_liters: "",
    notes: "",
  });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      date: form.date,
      method: form.method,
      duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes, 10) : null,
      water_amount_liters: form.water_liters ? parseFloat(form.water_liters) : null,
      notes: form.notes || null,
    };

    try {
      if (onSubmit) {
        await onSubmit({ ...payload, ...form });
      } else if (cropId) {
        await cropsApi.logIrrigation(cropId, payload);
      }
      if (onSaved) {
        await onSaved();
      }
      onClose();
    } catch (err) {
      setError(err?.message || "Failed to log irrigation event.");
    } finally {
      setSaving(false);
    }
  };

  const isBusy = externalLoading || saving;

  return (
    <Modal
      open={isModalOpen}
      onClose={onClose}
      title="Record Irrigation Event"
      description={cropName ? `For crop: ${cropName}` : "Log water application for soil balance."}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-xs text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Date *</label>
            <input
              required
              type="date"
              className="input"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Method *</label>
            <select
              className="input"
              value={form.method}
              onChange={(e) => setForm({ ...form, method: e.target.value })}
            >
              {METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Duration (Minutes)</label>
            <input
              type="number"
              min="1"
              className="input"
              placeholder="45"
              value={form.duration_minutes}
              onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Water Volume (Liters, optional)</label>
            <input
              type="number"
              min="0"
              className="input"
              placeholder="e.g. 5000"
              value={form.water_liters}
              onChange={(e) => setForm({ ...form, water_liters: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="label">Field Observations / Notes</label>
          <textarea
            rows={2}
            className="input resize-none"
            placeholder="e.g. Soil was drying out after hot afternoon."
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-primary-100 dark:border-primary-900/40">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={isBusy} className="btn-primary">
            {isBusy ? "Recording..." : "Save Record"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default IrrigationFormModal;
