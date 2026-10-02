import apiClient from "./client";

export const dashboardApi = {
  get: (farmId, cropCycleId) => {
    const query = cropCycleId ? `?crop_cycle_id=${cropCycleId}` : "";
    return apiClient.get(`/dashboard/${farmId}${query}`);
  },
};

export default dashboardApi;
