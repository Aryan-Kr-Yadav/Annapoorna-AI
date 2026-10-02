import React, { useState, useEffect, useCallback } from "react";
import {
  CheckCircle2,
  Calendar,
  Clock,
  Plus,
  Trash2,
  Edit2,
  Filter,
  Sparkles,
  AlertTriangle,
  Tractor,
  Sprout,
} from "lucide-react";
import { useFarms } from "../contexts/FarmContext";
import { useTranslation } from "../contexts/LanguageContext";
import tasksApi from "../api/tasks";
import cropsApi from "../api/crops";
import PageHeader from "../components/common/PageHeader";
import Badge from "../components/common/Badge";
import EmptyState from "../components/common/EmptyState";
import Skeleton from "../components/common/Skeleton";
import ConfirmDialog from "../components/common/ConfirmDialog";
import TaskFormModal from "../components/crops/TaskFormModal";
import { formatDate } from "../utils/formatters";

export default function Tasks() {
  const { t } = useTranslation();
  const { selectedFarm, selectFarm, farms, selectedCrop, selectCrop, crops } = useFarms();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // 'all' | 'today' | 'upcoming' | 'completed'

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [generating, setGenerating] = useState(false);

  const loadTasks = useCallback(async () => {
    if (!selectedFarm?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      let data = [];
      if (selectedCrop?.id) {
        data = await tasksApi.listByCrop(selectedCrop.id);
      } else {
        data = await tasksApi.listByFarm(selectedFarm.id);
      }
      setTasks(Array.isArray(data) ? data : []);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [selectedFarm?.id, selectedCrop?.id]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleToggleStatus = async (task) => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    try {
      await tasksApi.update(task.id, { status: newStatus });
      loadTasks();
    } catch (err) {
      alert("Failed to update task status: " + err.message);
    }
  };

  const handleDeleteTask = async () => {
    if (!deleteTarget) return;
    try {
      await tasksApi.delete(deleteTarget.id);
      setTasks((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      alert("Failed to delete task: " + err.message);
    }
  };

  const handleGenerateAiTasks = async () => {
    if (!selectedCrop?.id) return;
    setGenerating(true);
    try {
      await tasksApi.generate(selectedCrop.id);
      loadTasks();
    } catch (err) {
      alert("Failed to generate AI tasks: " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  // Filter tasks
  const todayStr = new Date().toISOString().slice(0, 10);
  const filteredTasks = tasks.filter((task) => {
    if (filter === "completed") return task.status === "completed";
    if (task.status === "completed") return false;
    if (filter === "today") return task.scheduled_date === todayStr;
    if (filter === "upcoming") return task.scheduled_date > todayStr;
    return true; // 'all' pending tasks
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <PageHeader
            title={t("tasks.title", "Farm Operations & Task Scheduler")}
            subtitle="Manage daily field work, irrigation schedules, fertilizer doses, and weeding activities."
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectedCrop && (
            <button
              onClick={handleGenerateAiTasks}
              disabled={generating}
              className="btn-secondary text-xs"
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5 text-primary-600" />
              {generating ? "Generating..." : "Auto-Plan Season Tasks"}
            </button>
          )}

          <button
            onClick={() => {
              setEditingTask(null);
              setModalOpen(true);
            }}
            className="btn-primary text-xs"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add Task
          </button>
        </div>
      </div>

      {/* Filter Tabs & Scope */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-lg border border-slate-200 p-0.5 text-xs dark:border-slate-800">
          {[
            { id: "all", label: "All Pending" },
            { id: "today", label: "Due Today" },
            { id: "upcoming", label: "Upcoming" },
            { id: "completed", label: "Completed" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-md px-3 py-1.5 font-semibold transition ${
                filter === f.id
                  ? "bg-primary-600 text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Crop Selector Scoping */}
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
          <Skeleton className="h-16 w-full" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No tasks match this filter"
          description={
            filter === "completed"
              ? "No completed tasks on record."
              : "Great job! There are no pending tasks scheduled for this period."
          }
          actionLabel="Schedule New Task"
          onAction={() => {
            setEditingTask(null);
            setModalOpen(true);
          }}
        />
      ) : (
        <div className="card divide-y divide-slate-100 dark:divide-slate-800 p-0 overflow-hidden">
          {filteredTasks.map((task) => {
            const isCompleted = task.status === "completed";
            return (
              <div
                key={task.id}
                className="flex items-center justify-between p-4 transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleToggleStatus(task)}
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                      isCompleted
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-slate-300 hover:border-emerald-500 dark:border-slate-700"
                    }`}
                  >
                    {isCompleted && <CheckCircle2 className="h-3.5 w-3.5" />}
                  </button>

                  <div>
                    <h4
                      className={`text-sm font-semibold ${
                        isCompleted
                          ? "line-through text-slate-400 dark:text-slate-500"
                          : "text-slate-900 dark:text-white"
                      }`}
                    >
                      {task.title}
                    </h4>

                    {task.description && (
                      <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                        {task.description}
                      </p>
                    )}

                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                        <Calendar className="h-3 w-3" />
                        {formatDate(task.scheduled_date)}
                      </span>
                      <span>•</span>
                      <span className="capitalize">{task.task_type || "General"}</span>
                      {task.priority && (
                        <Badge
                          variant={
                            task.priority === "high"
                              ? "error"
                              : task.priority === "medium"
                              ? "warning"
                              : "neutral"
                          }
                          className="text-[10px]"
                        >
                          {task.priority}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingTask(task);
                      setModalOpen(true);
                    }}
                    className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(task)}
                    className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Form Modal */}
      {modalOpen && (
        <TaskFormModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditingTask(null);
          }}
          cropId={editingTask?.crop_cycle_id || selectedCrop?.id || crops[0]?.id}
          task={editingTask}
          onSaved={loadTasks}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Scheduled Task"
        message={`Are you sure you want to delete "${deleteTarget?.title}"?`}
        confirmText="Delete"
        variant="danger"
        onConfirm={handleDeleteTask}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
