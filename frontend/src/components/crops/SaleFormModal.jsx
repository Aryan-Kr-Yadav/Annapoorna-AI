import React, { useState } from "react";
import { Modal } from "../common/Modal";
import cropsApi from "../../api/crops";

export function SaleFormModal({
  open = false,
  isOpen = false,
  onClose = () => {},
  onSubmit,
  onSaved,
  cropId,
  cropName = "",
  remainingInventory = null,
  remainingQuantity = null,
  unit = "quintal",
  loading: externalLoading = false,
}) {
  const isModalOpen = open || isOpen;
  const availableStock =
    remainingInventory !== null && remainingInventory !== undefined
      ? remainingInventory
      : remainingQuantity;

  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    quantity_sold: "",
    unit: unit || "quintal",
    price_per_unit: "",
    buyer_name: "",
    notes: "",
  });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const totalRevenue =
    parseFloat(form.quantity_sold || 0) * parseFloat(form.price_per_unit || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const qty = parseFloat(form.quantity_sold);
    const price = parseFloat(form.price_per_unit);

    if (isNaN(qty) || qty <= 0) {
      setError("Please enter a valid sold quantity.");
      return;
    }
    if (isNaN(price) || price <= 0) {
      setError("Please enter a valid price per unit in INR.");
      return;
    }
    if (availableStock !== null && qty > availableStock) {
      setError(`Cannot sell more than remaining inventory (${availableStock} ${form.unit || unit}).`);
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      sale_date: form.date,
      quantity_sold: qty,
      quantity_unit: form.unit || unit || "quintal",
      price_per_unit: price,
      buyer_name: form.buyer_name || null,
      notes: form.notes || null,
    };

    try {
      if (onSubmit) {
        await onSubmit({ ...payload, ...form, total_amount: totalRevenue });
      } else if (cropId) {
        await cropsApi.createSale(cropId, payload);
      }
      if (onSaved) {
        await onSaved();
      }
      onClose();
    } catch (err) {
      setError(err?.message || "Failed to record sale.");
    } finally {
      setSaving(false);
    }
  };

  const isBusy = externalLoading || saving;

  return (
    <Modal
      open={isModalOpen}
      onClose={onClose}
      title="Record Crop Sale"
      description={cropName ? `For crop: ${cropName}` : "Log produce sale, market rate, and revenue."}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-xs text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {availableStock !== null && (
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300">
            Available Inventory: <strong>{availableStock} {form.unit || unit}</strong>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Sale Date *</label>
            <input
              required
              type="date"
              className="input"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Buyer / Mandi</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. APMC Mandi / Local Trader"
              value={form.buyer_name}
              onChange={(e) => setForm({ ...form, buyer_name: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Quantity Sold *</label>
            <input
              required
              type="number"
              min="0.1"
              step="0.1"
              className="input"
              placeholder="e.g. 50"
              value={form.quantity_sold}
              onChange={(e) => setForm({ ...form, quantity_sold: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Rate per {form.unit || unit} (₹ INR) *</label>
            <input
              required
              type="number"
              min="0.1"
              step="0.1"
              className="input"
              placeholder="e.g. 2450"
              value={form.price_per_unit}
              onChange={(e) => setForm({ ...form, price_per_unit: e.target.value })}
            />
          </div>
        </div>

        {totalRevenue > 0 && (
          <div className="p-3 rounded-xl bg-primary-50 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-primary-900 dark:text-primary-100">
              Total Revenue:
            </span>
            <span className="text-base font-extrabold text-primary-700 dark:text-primary-400">
              ₹{totalRevenue.toLocaleString("en-IN")}
            </span>
          </div>
        )}

        <div>
          <label className="label">Notes / Payment Status</label>
          <textarea
            rows={2}
            className="input resize-none"
            placeholder="e.g. Payment received in bank account."
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-primary-100 dark:border-primary-900/40">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={isBusy} className="btn-primary">
            {isBusy ? "Recording..." : "Record Sale"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default SaleFormModal;
