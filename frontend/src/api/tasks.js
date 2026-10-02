import apiClient from "./client";

export const tasksApi = {
  listByCrop: (cropId, status) => apiClient.get(`/crops/${cropId}/tasks${status ? `?status=${status}` : ""}`),
  listByFarm: (farmId, status) => apiClient.get(`/farms/${farmId}/tasks${status ? `?status=${status}` : ""}`),
  create: (cropId, data) => apiClient.post(`/crops/${cropId}/tasks`, data),
  update: (taskId, data) => apiClient.put(`/tasks/${taskId}`, data),
  delete: (taskId) => apiClient.delete(`/tasks/${taskId}`),
  generate: (cropId) => apiClient.post(`/crops/${cropId}/tasks/generate`),
};

export default tasksApi;
