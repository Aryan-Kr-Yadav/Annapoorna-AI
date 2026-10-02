import React from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Modal } from "./Modal";

export function ConfirmDialog({
  open = false,
  isOpen = false,
  onClose,
  onCancel,
  onConfirm = () => {},
  title = "Confirm Deletion",
  message = "Are you sure you want to delete this record? This action cannot be undone.",
  confirmLabel,
  confirmText,
  variant = "danger",
  loading = false,
}) {
  const isModalOpen = Boolean(open || isOpen);
  const handleClose = onClose || onCancel || (() => {});
  const buttonLabel = confirmLabel || confirmText || "Delete";

  return (
    <Modal open={isModalOpen} onClose={handleClose} title={title} maxWidth="max-w-md">
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-900 dark:text-red-300">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed">{message}</p>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            disabled={loading}
            onClick={handleClose}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs px-4 py-2 shadow-xs transition disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>{loading ? "Deleting..." : buttonLabel}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;
