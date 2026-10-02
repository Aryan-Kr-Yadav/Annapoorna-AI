import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "../../utils/cn";

export function Modal({
  open = false,
  isOpen = false,
  onClose = () => {},
  title = "",
  description = "",
  children,
  maxWidth = "max-w-lg",
}) {
  const show = Boolean(open || isOpen);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && show) {
        onClose();
      }
    }
    if (show) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/60 dark:bg-black/75 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          "relative z-10 w-full overflow-hidden rounded-2xl border border-primary-100 dark:border-primary-900/50 bg-white dark:bg-[#162014] text-primary-950 dark:text-primary-50 shadow-2xl transition-all max-h-[90vh] flex flex-col",
          maxWidth
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-primary-100 dark:border-primary-900/40 px-6 py-4.5">
          <div>
            <h2 id="modal-title" className="text-base font-bold text-primary-950 dark:text-primary-50">
              {title}
            </h2>
            {description && (
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary-200 dark:border-primary-800 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-primary-900/40 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-6 py-5 flex-1">{children}</div>
      </div>
    </div>
  );
}

export default Modal;
