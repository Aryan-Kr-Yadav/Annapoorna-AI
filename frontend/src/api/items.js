import apiClient from "./client";

export const itemsApi = {
  // Tasks
  updateTask: (id, data) => apiClient.put(`/tasks/${id}`, data),
  deleteTask: (id) => apiClient.delete(`/tasks/${id}`),

  // Irrigation
  deleteIrrigation: (cropId, logId) => apiClient.delete(`/crops/${cropId}/irrigation/${logId}`),

  // Expenses
  updateExpense: (id, data) => apiClient.put(`/expenses/${id}`, data),
  deleteExpense: (id) => apiClient.delete(`/expenses/${id}`),

  // Harvests & Sales
  deleteHarvest: (id) => apiClient.delete(`/harvests/${id}`),
  deleteSale: (id) => apiClient.delete(`/sales/${id}`),

  // Soil
  deleteSoilTest: (id) => apiClient.delete(`/soil-tests/${id}`),
};

export default itemsApi;
