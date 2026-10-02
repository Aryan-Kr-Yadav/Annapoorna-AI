import React, { useState, useEffect } from "react";
import { Modal } from "../common/Modal";
import cropsApi from "../../api/crops";

const CATEGORIES = [
  { value: "fertilizer", label: "Fertilizers & Nutrients" },
  { value: "seeds", label: "Seeds & Seedlings" },
  { value: "pesticides", label: "Pesticides & Crop Protection" },
  { value: "irrigation", label: "Irrigation & Electricity" },
  { value: "machinery", label: "Machinery & Fuel" },
  { value: "labour", label: "Labor & Field Work" },
  { value: "transport", label: "Storage & Transport" },
  { value: "other", label: "Other / Miscellaneous" },
];

export function ExpenseFormModal({
  open = false,
  isOpen = false,
  onClose = () => {},
  onSubmit,
  onSaved,
  cropId,
  initialData = null,
  expense = null,
  cropName = "",
  loading: externalLoading = false,
}) {
  const isModalOpen = open || isOpen;
  const activeExpense = initialData || expense;

  const [form, setForm] = useState({
    category: "fertilizer",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    notes: "",
  });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (activeExpense) {
      setForm({
        category: (activeExpense.category || "fertilizer").toLowerCase(),
        amount: activeExpense.amount ? String(activeExpense.amount) : "",
        date: activeExpense.date ? activeExpense.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
        notes: activeExpense.notes || "",
      });
    } else {
      setForm({
        category: "fertilizer",
        amount: "",
        date: new Date().toISOString().slice(0, 10),
        notes: "",
      });
    }
    setError(null);
  }, [activeExpense, isModalOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const num = parseFloat(form.amount);
    if (isNaN(num) || num <= 0) {
      setError("Please enter a valid expense amount in INR.");
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      category: form.category,
      amount: num,
      date: form.date,
      notes: form.notes || null,
    };

    try {
      if (onSubmit) {
        await onSubmit({ ...payload, ...form, amount: num });
      } else if (activeExpense?.id) {
        await cropsApi.updateExpense(activeExpense.id, payload);
      } else if (cropId) {
        await cropsApi.createExpense(cropId, payload);
      }
      if (onSaved) {
        await onSaved();
      }
      onClose();
    } catch (err) {
      setError(err?.message || "Failed to record expense.");
    } finally {
      setSaving(false);
    }
  };

  const isBusy = externalLoading || saving;

  return (
    <Modal
      open={isModalOpen}
      onClose={onClose}
      title={activeExpense ? "Edit Season Expense" : "Record Input Expense"}
      description={cropName ? `For crop: ${cropName}` : "Log cost for seeds, fertilizer, machinery, or labor."}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-xs text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <div>
          <label className="label">Expense Category *</label>
          <select
            className="input"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Amount (₹ INR) *</label>
            <input
              required
              type="number"
              min="1"
              step="1"
              className="input"
              placeholder="e.g. 1800"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Expense Date *</label>
            <input
              required
              type="date"
              className="input"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="label">Item Description / Vendor Notes</label>
          <textarea
            rows={2}
            className="input resize-none"
            placeholder="e.g. 2 bags of Urea from IFFCO Kisan Seva Kendra"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-primary-100 dark:border-primary-900/40">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={isBusy} className="btn-primary">
            {isBusy ? "Saving..." : activeExpense ? "Update Expense" : "Record Expense"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default ExpenseFormModal;
