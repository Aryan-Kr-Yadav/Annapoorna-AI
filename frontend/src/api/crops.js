import apiClient from "./client";

export const cropsApi = {
  get: (id) => apiClient.get(`/crops/${id}`),
  create: (farmId, data) => apiClient.post(`/farms/${farmId}/crops`, data),
  update: (id, data) => apiClient.put(`/crops/${id}`, data),
  delete: (id) => apiClient.delete(`/crops/${id}`),
  getLifecycle: (id) => apiClient.get(`/crops/${id}/lifecycle`),
  getTasks: (id, status) => apiClient.get(`/crops/${id}/tasks${status ? `?status=${status}` : ""}`),
  createTask: (id, data) => apiClient.post(`/crops/${id}/tasks`, data),
  updateTask: (taskId, data) => apiClient.put(`/tasks/${taskId}`, data),
  deleteTask: (taskId) => apiClient.delete(`/tasks/${taskId}`),
  generateTasks: (id) => apiClient.post(`/crops/${id}/tasks/generate`),
  getIrrigation: (id) => apiClient.get(`/crops/${id}/irrigation`),
  logIrrigation: (id, data) => apiClient.post(`/crops/${id}/irrigation`, data),
  deleteIrrigation: (cropId, logId) => apiClient.delete(`/crops/${cropId}/irrigation/${logId}`),
  getIrrigationEstimate: (id) => apiClient.get(`/crops/${id}/irrigation/next`),
  getSoilTests: (id) => apiClient.get(`/crops/${id}/soil-tests`),
  createSoilTest: (id, data) => apiClient.post(`/crops/${id}/soil-tests`, data),
  deleteSoilTest: (testId) => apiClient.delete(`/soil-tests/${testId}`),
  getDiagnoses: (id) => apiClient.get(`/crops/${id}/diagnoses`),
  createDiagnosis: (id, formData) => apiClient.post(`/crops/${id}/diagnoses`, formData, true),
  getExpenses: (id, category) => apiClient.get(`/crops/${id}/expenses${category ? `?category=${category}` : ""}`),
  createExpense: (id, data) => apiClient.post(`/crops/${id}/expenses`, data),
  updateExpense: (expenseId, data) => apiClient.put(`/expenses/${expenseId}`, data),
  deleteExpense: (expenseId) => apiClient.delete(`/expenses/${expenseId}`),
  getHarvests: (id) => apiClient.get(`/crops/${id}/harvests`),
  createHarvest: (id, data) => apiClient.post(`/crops/${id}/harvests`, data),
  deleteHarvest: (cropId, harvestId) => apiClient.delete(`/crops/${cropId}/harvests/${harvestId}`),
  getSales: async (id) => {
    const res = await apiClient.get(`/crops/${id}/sales`);
    return Array.isArray(res) ? res : (res?.sales || []);
  },
  createSale: (id, data) => apiClient.post(`/crops/${id}/sales`, data),
  deleteSale: (cropId, saleId) => apiClient.delete(`/crops/${cropId}/sales/${saleId}`),
  getSaleSummary: (id) => apiClient.get(`/crops/${id}/sales`),
  getSeasonReport: (id) => apiClient.get(`/crops/${id}/season-report`),
};

export default cropsApi;
