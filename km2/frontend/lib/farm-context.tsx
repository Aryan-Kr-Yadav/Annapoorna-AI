"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useApi } from "@/lib/api-client";
import type { Farm } from "@/lib/types";

interface FarmContextValue {
  farms: Farm[];
  selectedFarm: Farm | null;
  selectFarm: (farmId: string) => void;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const FarmContext = createContext<FarmContextValue | null>(null);

export function FarmProvider({ children }: { children: React.ReactNode }) {
  const api = useApi();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    api
      .get<Farm[]>("/farms")
      .then((data) => {
        setFarms(data);
        const stored = typeof window !== "undefined" ? window.localStorage.getItem("km_selected_farm") : null;
        const validStored = stored && data.some((f) => f.id === stored) ? stored : null;
        setSelectedFarmId(validStored || data[0]?.id || null);
      })
      .catch((e) => setError(e.message || "Could not load your farms."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selectFarm = (farmId: string) => {
    setSelectedFarmId(farmId);
    if (typeof window !== "undefined") window.localStorage.setItem("km_selected_farm", farmId);
  };

  const selectedFarm = farms.find((f) => f.id === selectedFarmId) || null;

  return (
    <FarmContext.Provider value={{ farms, selectedFarm, selectFarm, loading, error, refresh: load }}>
      {children}
    </FarmContext.Provider>
  );
}

export function useFarms() {
  const ctx = useContext(FarmContext);
  if (!ctx) throw new Error("useFarms must be used within FarmProvider");
  return ctx;
}
