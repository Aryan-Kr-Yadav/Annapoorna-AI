import apiClient from "./client";

export const soilApi = {
  listByCrop: (cropId) => apiClient.get(`/crops/${cropId}/soil-tests`),
  listByFarm: (farmId) => apiClient.get(`/farms/${farmId}/soil-tests`),
  createForCrop: (cropId, data) => apiClient.post(`/crops/${cropId}/soil-tests`, data),
  createForFarm: (farmId, data) => apiClient.post(`/farms/${farmId}/soil-tests`, data),
  delete: (testId) => apiClient.delete(`/soil-tests/${testId}`),
};

export default soilApi;
