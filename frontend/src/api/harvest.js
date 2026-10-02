import apiClient from "./client";

export const harvestApi = {
  listByCrop: (cropId) => apiClient.get(`/crops/${cropId}/harvests`),
  create: (cropId, data) => apiClient.post(`/crops/${cropId}/harvests`, data),
};

export default harvestApi;
