import React, { useState, useEffect } from "react";
import { Modal } from "../common/Modal";
import tasksApi from "../../api/tasks";
import cropsApi from "../../api/crops";

const TASK_TYPES = [
  { value: "fertilization", label: "Fertilizer / Nutrient Application" },
  { value: "irrigation", label: "Irrigation" },
  { value: "inspection", label: "Crop Health Inspection" },
  { value: "soil", label: "Soil Treatment / Testing" },
  { value: "harvest", label: "Harvest Operation" },
  { value: "custom", label: "General Field Activity" },
];

const PRIORITIES = [
  { value: "low", label: "Low Priority" },
  { value: "medium", label: "Medium Priority" },
  { value: "high", label: "High Priority (Urgent)" },
];

export function TaskFormModal({
  open = false,
  isOpen = false,
  onClose = () => {},
  onSubmit,
  onSaved,
  cropId,
  initialData = null,
  task = null,
  loading: externalLoading = false,
}) {
  const isModalOpen = open || isOpen;
  const activeTask = initialData || task;

  const [form, setForm] = useState({
    title: "",
    description: "",
    task_type: "fertilization",
    scheduled_date: new Date().toISOString().slice(0, 10),
    priority: "medium",
  });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (activeTask) {
      setForm({
        title: activeTask.title || "",
        description: activeTask.description || "",
        task_type: (activeTask.task_type || "fertilization").toLowerCase(),
        scheduled_date: activeTask.scheduled_date
          ? activeTask.scheduled_date.slice(0, 10)
          : new Date().toISOString().slice(0, 10),
        priority: (activeTask.priority || "medium").toLowerCase(),
      });
    } else {
      setForm({
        title: "",
        description: "",
        task_type: "fertilization",
        scheduled_date: new Date().toISOString().slice(0, 10),
        priority: "medium",
      });
    }
    setError(null);
  }, [activeTask, isModalOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Please enter a task title.");
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      title: form.title.trim(),
      description: form.description || null,
      task_type: form.task_type,
      scheduled_date: form.scheduled_date,
      priority: form.priority,
    };

    try {
      if (onSubmit) {
        await onSubmit(payload);
      } else if (activeTask?.id) {
        await tasksApi.update(activeTask.id, payload);
      } else if (cropId) {
        await cropsApi.createTask(cropId, payload);
      }
      if (onSaved) {
        await onSaved();
      }
      onClose();
    } catch (err) {
      setError(err?.message || "Failed to save task.");
    } finally {
      setSaving(false);
    }
  };

  const isBusy = externalLoading || saving;

  return (
    <Modal
      open={isModalOpen}
      onClose={onClose}
      title={activeTask ? "Edit Farm Task" : "Schedule New Farm Task"}
      description="Plan agronomic interventions, weeding, spraying, or harvests."
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-xs text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <div>
          <label className="label">Task Title *</label>
          <input
            required
            type="text"
            className="input"
            placeholder="e.g. Apply Zinc Sulphate & Urea"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Task Category</label>
            <select
              className="input"
              value={form.task_type}
              onChange={(e) => setForm({ ...form, task_type: e.target.value })}
            >
              {TASK_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Scheduled Date *</label>
            <input
              required
              type="date"
              className="input"
              value={form.scheduled_date}
              onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="label">Priority Level</label>
          <select
            className="input"
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value })}
          >
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Notes / Instructions (Optional)</label>
          <textarea
            rows={3}
            className="input resize-none"
            placeholder="e.g. Spray in early morning before wind picks up."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-primary-100 dark:border-primary-900/40">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={isBusy} className="btn-primary">
            {isBusy ? "Saving..." : activeTask ? "Update Task" : "Create Task"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default TaskFormModal;
