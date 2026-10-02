import React, { useState, useEffect } from "react";
import { Modal } from "../common/Modal";

const SEASONS = ["kharif", "rabi", "zaid", "perennial"];

export function CropFormModal({
  open = false,
  onClose = () => {},
  onSubmit = () => {},
  initialData = null,
  farmName = "",
  loading = false,
}) {
  const [form, setForm] = useState({
    crop_name: "",
    variety: "",
    season: "rabi",
    year: new Date().getFullYear(),
    sowing_date: new Date().toISOString().slice(0, 10),
    expected_harvest_date: "",
    area: "",
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialData) {
      setForm({
        crop_name: initialData.crop_name || "",
        variety: initialData.variety || "",
        season: initialData.season || "rabi",
        year: initialData.year || new Date().getFullYear(),
        sowing_date: initialData.sowing_date ? initialData.sowing_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
        expected_harvest_date: initialData.expected_harvest_date ? initialData.expected_harvest_date.slice(0, 10) : "",
        area: initialData.area !== undefined && initialData.area !== null ? String(initialData.area) : "",
      });
    } else {
      setForm({
        crop_name: "",
        variety: "",
        season: "rabi",
        year: new Date().getFullYear(),
        sowing_date: new Date().toISOString().slice(0, 10),
        expected_harvest_date: "",
        area: "",
      });
    }
    setError(null);
  }, [initialData, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.crop_name.trim()) {
      setError("Please specify the crop name.");
      return;
    }

    try {
      await onSubmit({
        ...form,
        expected_harvest_date: form.expected_harvest_date || null,
        area: form.area ? parseFloat(form.area) : null,
      });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save crop cycle.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initialData ? "Edit Crop Cycle" : "Add Crop Cycle"}
      description={farmName ? `Farm parcel: ${farmName}` : "Register a sown or planned crop."}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-xs text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Crop Name *</label>
            <input
              required
              type="text"
              className="input"
              placeholder="e.g. Wheat"
              value={form.crop_name}
              onChange={(e) => setForm({ ...form, crop_name: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Variety / Cultivar</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. HD-2967 / Sharbati"
              value={form.variety}
              onChange={(e) => setForm({ ...form, variety: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Season *</label>
            <select
              className="input capitalize"
              value={form.season}
              onChange={(e) => setForm({ ...form, season: e.target.value })}
            >
              {SEASONS.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Crop Year</label>
            <input
              type="number"
              className="input"
              value={form.year}
              onChange={(e) => setForm({ ...form, year: parseInt(e.target.value, 10) || new Date().getFullYear() })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Sowing Date *</label>
            <input
              required
              type="date"
              className="input"
              value={form.sowing_date}
              onChange={(e) => setForm({ ...form, sowing_date: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Expected Harvest Date</label>
            <input
              type="date"
              className="input"
              value={form.expected_harvest_date}
              onChange={(e) => setForm({ ...form, expected_harvest_date: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="label">Planted Area in Acres (Optional)</label>
          <input
            type="number"
            step="0.1"
            className="input"
            placeholder="e.g. 2.0"
            value={form.area}
            onChange={(e) => setForm({ ...form, area: e.target.value })}
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-primary-100 dark:border-primary-900/40">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Saving..." : initialData ? "Update Crop" : "Add Crop"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default CropFormModal;
