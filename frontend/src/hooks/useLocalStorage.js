import { useState, useCallback } from "react";

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setStoredValue = useCallback(
    (newValue) => {
      setValue(newValue);
      try {
        window.localStorage.setItem(key, JSON.stringify(newValue));
      } catch {
        // Storage may be unavailable (private browsing, quota) — fail silently.
      }
    },
    [key]
  );

  return [value, setStoredValue];
}
