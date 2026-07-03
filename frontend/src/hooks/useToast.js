import toast from "react-hot-toast";

/**
 * Thin semantic wrapper around react-hot-toast so components don't import
 * the toast library directly — keeps notification styling centralized.
 */
export function useToast() {
  return {
    success: (msg) => toast.success(msg),
    error: (msg) => toast.error(msg),
    loading: (msg) => toast.loading(msg),
    dismiss: (id) => toast.dismiss(id),
  };
}
