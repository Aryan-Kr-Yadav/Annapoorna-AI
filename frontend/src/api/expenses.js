import apiClient from "./client";

export const expensesApi = {
  listByCrop: (cropId, category) => apiClient.get(`/crops/${cropId}/expenses${category ? `?category=${category}` : ""}`),
  create: (cropId, data) => apiClient.post(`/crops/${cropId}/expenses`, data),
  update: (expenseId, data) => apiClient.put(`/expenses/${expenseId}`, data),
  delete: (expenseId) => apiClient.delete(`/expenses/${expenseId}`),
};

export default expensesApi;
