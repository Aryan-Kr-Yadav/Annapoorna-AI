import apiClient from "./client";

export const analyticsApi = {
  getSeasons: (farmId, cropName = null) => {
    const q = cropName ? `?crop_name=${encodeURIComponent(cropName)}` : "";
    return apiClient.get(`/analytics/farms/${farmId}/seasons${q}`);
  },
  getFarmSeasons: (farmId, cropName = null) => {
    const q = cropName ? `?crop_name=${encodeURIComponent(cropName)}` : "";
    return apiClient.get(`/analytics/farms/${farmId}/seasons${q}`);
  },
};

export default analyticsApi;
