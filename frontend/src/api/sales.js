import apiClient from "./client";

export const salesApi = {
  listByCrop: (cropId) => apiClient.get(`/crops/${cropId}/sales`),
  create: (cropId, data) => apiClient.post(`/crops/${cropId}/sales`, data),
  getSummary: (cropId) => apiClient.get(`/crops/${cropId}/sales/summary`),
};

export default salesApi;
