import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import farmsApi from "../api/farms";
import { useAuth } from "./AuthContext";

const FarmContext = createContext(null);

const STORAGE_FARM_KEY = "annapoorna_selected_farm";
const STORAGE_CROP_PREFIX = "annapoorna_selected_crop_";

export function FarmProvider({ children }) {
  const { user } = useAuth();
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState(null);
  const [crops, setCrops] = useState([]);
  const [selectedCropId, setSelectedCropId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingCrops, setLoadingCrops] = useState(false);
  const [error, setError] = useState(null);

  // Load farms
  const loadFarms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await farmsApi.list();
      const farmList = Array.isArray(data) ? data : [];
      setFarms(farmList);

      // Determine initial active farm
      const stored = localStorage.getItem(STORAGE_FARM_KEY);
      const validStored = stored && farmList.some((f) => f.id === stored && !f.is_archived) ? stored : null;
      const initialFarm = validStored || farmList.find((f) => !f.is_archived)?.id || farmList[0]?.id || null;

      setSelectedFarmId(initialFarm);
      if (initialFarm) {
        localStorage.setItem(STORAGE_FARM_KEY, initialFarm);
      }
    } catch (err) {
      setError(err.message || "Could not load farm records.");
      setFarms([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadFarms();
    } else {
      setFarms([]);
      setSelectedFarmId(null);
      setCrops([]);
      setSelectedCropId(null);
      setLoading(false);
    }
  }, [user, loadFarms]);

  // Load crops when selected farm changes
  const loadCropsForFarm = useCallback(async (farmId) => {
    if (!farmId) {
      setCrops([]);
      setSelectedCropId(null);
      return;
    }

    setLoadingCrops(true);
    try {
      const data = await farmsApi.getCrops(farmId);
      const cropList = Array.isArray(data) ? data : [];
      setCrops(cropList);

      const storedCropKey = `${STORAGE_CROP_PREFIX}${farmId}`;
      const storedCrop = localStorage.getItem(storedCropKey);
      const validStored = storedCrop && cropList.some((c) => c.id === storedCrop && c.status !== "archived") ? storedCrop : null;

      const activeCrop = cropList.find((c) => c.status === "active");
      const fallbackCrop = activeCrop || cropList.find((c) => c.status !== "archived") || cropList[0] || null;

      const targetCropId = validStored || fallbackCrop?.id || null;
      setSelectedCropId(targetCropId);

      if (targetCropId) {
        localStorage.setItem(storedCropKey, targetCropId);
        localStorage.setItem("annapoorna_selected_crop", targetCropId);
      }
    } catch {
      setCrops([]);
      setSelectedCropId(null);
    } finally {
      setLoadingCrops(false);
    }
  }, []);

  useEffect(() => {
    if (selectedFarmId) {
      loadCropsForFarm(selectedFarmId);
    } else {
      setCrops([]);
      setSelectedCropId(null);
    }
  }, [selectedFarmId, loadCropsForFarm]);

  const selectFarm = (farmId) => {
    if (farmId === selectedFarmId) return;
    setSelectedFarmId(farmId);
    if (farmId) {
      localStorage.setItem(STORAGE_FARM_KEY, farmId);
    }
  };

  const selectCrop = (cropId) => {
    setSelectedCropId(cropId);
    if (cropId && selectedFarmId) {
      localStorage.setItem(`${STORAGE_CROP_PREFIX}${selectedFarmId}`, cropId);
      localStorage.setItem("annapoorna_selected_crop", cropId);
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

export default FarmContext;
