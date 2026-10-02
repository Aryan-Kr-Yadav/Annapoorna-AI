import React, { useState } from "react";
import { Modal } from "../common/Modal";
import cropsApi from "../../api/crops";

export function HarvestFormModal({
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
    quantity: "",
    unit: "quintal",
    quality_grade: "A",
    selling_price_per_unit: "",
    notes: "",
  });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const qty = parseFloat(form.quantity);
    if (isNaN(qty) || qty <= 0) {
      setError("Please enter a valid harvest yield quantity.");
      return;
    }

    setSaving(true);
    setError(null);

    const price = form.selling_price_per_unit ? parseFloat(form.selling_price_per_unit) : null;

    const payload = {
      harvest_date: form.date,
      yield_quantity: qty,
      yield_unit: form.unit,
      selling_price_per_unit: price && !isNaN(price) ? price : null,
    };

    try {
      if (onSubmit) {
        await onSubmit({ ...payload, ...form, quantity: qty });
      } else if (cropId) {
        await cropsApi.createHarvest(cropId, payload);
      }
      if (onSaved) {
        await onSaved();
      }
      onClose();
    } catch (err) {
      setError(err?.message || "Failed to record harvest.");
    } finally {
      setSaving(false);
    }
  };

  const isBusy = externalLoading || saving;

  return (
    <Modal
      open={isModalOpen}
      onClose={onClose}
      title="Record Crop Harvest"
      description={cropName ? `For crop: ${cropName}` : "Log harvested produce yield into farm inventory."}
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
            <label className="label">Harvest Date *</label>
            <input
              required
              type="date"
              className="input"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Quality Grade</label>
            <select
              className="input"
              value={form.quality_grade}
              onChange={(e) => setForm({ ...form, quality_grade: e.target.value })}
            >
              <option value="A">Grade A (Premium)</option>
              <option value="B">Grade B (Standard)</option>
              <option value="C">Grade C (Commercial)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Quantity Harvested *</label>
            <input
              required
              type="number"
              min="0.1"
              step="0.1"
              className="input"
              placeholder="e.g. 85"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Unit</label>
            <select
              className="input"
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
            >
              <option value="quintal">Quintals (100 kg)</option>
              <option value="kg">Kilograms (kg)</option>
              <option value="ton">Metric Tons</option>
              <option value="crate">Crates / Boxes</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label">Expected Selling Price per Unit (₹ INR, optional)</label>
          <input
            type="number"
            min="0"
            step="1"
            className="input"
            placeholder="e.g. 2400"
            value={form.selling_price_per_unit}
            onChange={(e) => setForm({ ...form, selling_price_per_unit: e.target.value })}
          />
        </div>

        <div>
          <label className="label">Storage Location / Field Notes</label>
          <textarea
            rows={2}
            className="input resize-none"
            placeholder="e.g. Stored in dry shed; moisture level checked."
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-primary-100 dark:border-primary-900/40">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={isBusy} className="btn-primary">
            {isBusy ? "Recording..." : "Record Harvest"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default HarvestFormModal;
