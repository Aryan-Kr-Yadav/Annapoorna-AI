import apiClient from "./client";

export const irrigationApi = {
  listByCrop: (cropId) => apiClient.get(`/crops/${cropId}/irrigation`),
  listByFarm: (farmId) => apiClient.get(`/farms/${farmId}/irrigation`),
  log: (cropId, data) => apiClient.post(`/crops/${cropId}/irrigation`, data),
  delete: (cropId, logId) => apiClient.delete(`/crops/${cropId}/irrigation/${logId}`),
  getNextEstimate: (cropId) => apiClient.get(`/crops/${cropId}/irrigation/next`),
};

export default irrigationApi;
