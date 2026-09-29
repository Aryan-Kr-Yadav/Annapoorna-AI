"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useApi } from "@/lib/api-client";
import type { Farm, CropCycle } from "@/lib/types";

interface FarmContextValue {
  farms: Farm[];
  selectedFarm: Farm | null;
  selectFarm: (farmId: string) => void;
  crops: CropCycle[];
  selectedCrop: CropCycle | null;
  selectCrop: (cropId: string) => void;
  loading: boolean;
  loadingCrops: boolean;
  error: string | null;
  refresh: () => void;
  refreshCrops: () => void;
}

const FarmContext = createContext<FarmContextValue | null>(null);

export function FarmProvider({ children }: { children: React.ReactNode }) {
  const api = useApi();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const [crops, setCrops] = useState<CropCycle[]>([]);
  const [selectedCropId, setSelectedCropId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingCrops, setLoadingCrops] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load farms
  const loadFarms = useCallback(() => {
    setLoading(true);
    setError(null);
    api
      .get<Farm[]>("/farms")
      .then((data) => {
        setFarms(data);

        // Determine best farm to select
        const stored = typeof window !== "undefined"
          ? window.localStorage.getItem("annapoorna_selected_farm") || window.localStorage.getItem("km_selected_farm")
          : null;

        const validStored = stored && data.some((f) => f.id === stored && !f.is_archived) ? stored : null;
        const initialFarm = validStored || data.find((f) => !f.is_archived)?.id || data[0]?.id || null;
        setSelectedFarmId(initialFarm);
      })
      .catch((e) => setError(e.message || "Could not load your farms."))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadFarms();
  }, [loadFarms]);

  // Load crops whenever selected farm changes
  const loadCropsForFarm = useCallback((farmId: string) => {
    setLoadingCrops(true);
    api
      .get<CropCycle[]>(`/farms/${farmId}/crops`)
      .then((data) => {
        setCrops(data);

        // Check if there's a stored crop for this farm
        const storedCropKey = `annapoorna_selected_crop_${farmId}`;
        const storedCrop = typeof window !== "undefined"
          ? window.localStorage.getItem(storedCropKey) || window.localStorage.getItem("annapoorna_selected_crop")
          : null;

        const validStored = storedCrop && data.some((c) => c.id === storedCrop && c.status !== "archived") ? storedCrop : null;

        // Fallback priority:
        // 1. Valid stored crop
        // 2. First active crop
        // 3. First non-archived crop
        // 4. null
        const activeCrop = data.find((c) => c.status === "active");
        const fallbackCrop = activeCrop || data.find((c) => c.status !== "archived") || data[0] || null;

        const targetCropId = validStored || fallbackCrop?.id || null;
        setSelectedCropId(targetCropId);
        if (targetCropId && typeof window !== "undefined") {
          window.localStorage.setItem(storedCropKey, targetCropId);
          window.localStorage.setItem("annapoorna_selected_crop", targetCropId);
        }
      })
      .catch(() => {
        setCrops([]);
        setSelectedCropId(null);
      })
      .finally(() => setLoadingCrops(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedFarmId) {
      loadCropsForFarm(selectedFarmId);
    } else {
      setCrops([]);
      setSelectedCropId(null);
    }
  }, [selectedFarmId, loadCropsForFarm]);

  const selectFarm = (farmId: string) => {
    if (farmId === selectedFarmId) return;
    setSelectedFarmId(farmId);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("annapoorna_selected_farm", farmId);
    }
  };

  const selectCrop = (cropId: string) => {
    setSelectedCropId(cropId);
    if (typeof window !== "undefined") {
      if (selectedFarmId) {
        window.localStorage.setItem(`annapoorna_selected_crop_${selectedFarmId}`, cropId);
      }
      window.localStorage.setItem("annapoorna_selected_crop", cropId);
    }
  };

  const selectedFarm = farms.find((f) => f.id === selectedFarmId) || null;
  const selectedCrop = crops.find((c) => c.id === selectedCropId) || null;

  const refreshCrops = () => {
    if (selectedFarmId) {
      loadCropsForFarm(selectedFarmId);
    }
  };

  return (
    <FarmContext.Provider
      value={{
        farms,
        selectedFarm,
        selectFarm,
        crops,
        selectedCrop,
        selectCrop,
        loading,
        loadingCrops,
        error,
        refresh: loadFarms,
        refreshCrops,
      }}
    >
      {children}
    </FarmContext.Provider>
  );
}

export function useFarms() {
  const ctx = useContext(FarmContext);
  if (!ctx) throw new Error("useFarms must be used within FarmProvider");
  return ctx;
}
