import React, { useState, useEffect } from "react";
import { Modal } from "../common/Modal";

const STATES = [
  "Uttar Pradesh",
  "Madhya Pradesh",
  "Punjab",
  "Haryana",
  "Rajasthan",
  "Maharashtra",
  "Bihar",
  "Gujarat",
  "Karnataka",
  "Tamil Nadu",
  "Andhra Pradesh",
  "West Bengal",
  "Other",
];

const SOIL_TYPES = [
  "Alluvial",
  "Black / Regur",
  "Red & Yellow",
  "Laterite",
  "Sandy / Arid",
  "Clayey",
  "Loamy",
  "Other",
];

const IRRIGATION_TYPES = [
  { value: "rainfed", label: "Rainfed (Monsoon Dependent)" },
  { value: "borewell", label: "Tubewell / Borewell" },
  { value: "drip", label: "Drip Irrigation" },
  { value: "sprinkler", label: "Sprinkler Irrigation" },
  { value: "canal", label: "Canal Water" },
  { value: "other", label: "Other Source" },
];

export function FarmFormModal({
  open = false,
  onClose = () => {},
  onSubmit = () => {},
  initialData = null,
  loading = false,
}) {
  const [form, setForm] = useState({
    name: "",
    state: "Uttar Pradesh",
    district: "",
    village_or_city: "",
    area: "",
    area_unit: "acre",
    soil_type: "Loamy",
    irrigation_type: "drip",
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || "",
        state: initialData.state || "Uttar Pradesh",
        district: initialData.district || "",
        village_or_city: initialData.village_or_city || "",
        area: initialData.area !== undefined ? String(initialData.area) : "",
        area_unit: initialData.area_unit || "acre",
        soil_type: initialData.soil_type || "Loamy",
        irrigation_type: initialData.irrigation_type || "drip",
      });
    } else {
      setForm({
        name: "",
        state: "Uttar Pradesh",
        district: "",
        village_or_city: "",
        area: "",
        area_unit: "acre",
        soil_type: "Loamy",
        irrigation_type: "drip",
      });
    }
    setError(null);
  }, [initialData, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Please provide a name for this farm.");
      return;
    }
    if (!form.district.trim()) {
      setError("Please specify the district.");
      return;
    }
    const numArea = parseFloat(form.area);
    if (isNaN(numArea) || numArea <= 0) {
      setError("Please enter a valid farm area greater than 0.");
      return;
    }

    try {
      await onSubmit({
        ...form,
        area: numArea,
      });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save farm.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initialData ? "Edit Farm Parcel" : "Add New Agricultural Farm"}
      description="Enter farm details, boundary size, and primary irrigation."
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-xs text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <div>
          <label className="label">Farm Name *</label>
          <input
            required
            type="text"
            className="input"
            placeholder="e.g. Green Valley Plot A"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">State *</label>
            <select
              className="input"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
            >
              {STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">District *</label>
            <input
              required
              type="text"
              className="input"
              placeholder="e.g. Ghaziabad"
              value={form.district}
              onChange={(e) => setForm({ ...form, district: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="label">Village / City (Optional)</label>
          <input
            type="text"
            className="input"
            placeholder="e.g. Muradnagar"
            value={form.village_or_city}
            onChange={(e) => setForm({ ...form, village_or_city: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Area Size *</label>
            <input
              required
              type="number"
              step="0.05"
              min="0.05"
              className="input"
              placeholder="2.5"
              value={form.area}
              onChange={(e) => setForm({ ...form, area: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Unit</label>
            <select
              className="input"
              value={form.area_unit}
              onChange={(e) => setForm({ ...form, area_unit: e.target.value })}
            >
              <option value="acre">Acres</option>
              <option value="hectare">Hectares</option>
              <option value="bigha">Bigha</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Soil Type</label>
            <select
              className="input"
              value={form.soil_type}
              onChange={(e) => setForm({ ...form, soil_type: e.target.value })}
            >
              {SOIL_TYPES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Irrigation Source</label>
            <select
              className="input"
              value={form.irrigation_type}
              onChange={(e) => setForm({ ...form, irrigation_type: e.target.value })}
            >
              {IRRIGATION_TYPES.map((it) => (
                <option key={it.value} value={it.value}>
                  {it.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-primary-100 dark:border-primary-900/40">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Saving..." : initialData ? "Update Farm" : "Create Farm"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default FarmFormModal;
