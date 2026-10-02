import apiClient from "./client";

export const farmsApi = {
  list: () => apiClient.get("/farms"),
  get: (id) => apiClient.get(`/farms/${id}`),
  create: (data) => apiClient.post("/farms", data),
  update: (id, data) => apiClient.put(`/farms/${id}`, data),
  delete: (id) => apiClient.delete(`/farms/${id}`),
  getCrops: (id) => apiClient.get(`/farms/${id}/crops`),
  getWeather: (id) => apiClient.get(`/farms/${id}/weather`),
  getTasks: (id, status) => apiClient.get(`/farms/${id}/tasks${status ? `?status=${status}` : ""}`),
  getIrrigation: (id) => apiClient.get(`/farms/${id}/irrigation`),
  getSoilTests: (id) => apiClient.get(`/farms/${id}/soil-tests`),
  createSoilTest: (id, data) => apiClient.post(`/farms/${id}/soil-tests`, data),
};

export default farmsApi;
