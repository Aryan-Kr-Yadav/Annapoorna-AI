import apiClient from "./client";

export const marketApi = {
  getPrices: (crop, state) =>
    apiClient.get(`/market/prices?crop=${encodeURIComponent(crop)}&state=${encodeURIComponent(state)}`),
};

export default marketApi;
