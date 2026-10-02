import apiClient from "./client";

export const weatherApi = {
  getForFarm: (farmId) => apiClient.get(`/farms/${farmId}/weather`),
};

export default weatherApi;
