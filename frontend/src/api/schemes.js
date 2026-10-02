import apiClient from "./client";

export const schemesApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient.get(`/schemes${query ? `?${query}` : ""}`);
  },
  get: (id) => apiClient.get(`/schemes/${id}`),
  search: (q) => apiClient.get(`/schemes/search?q=${encodeURIComponent(q)}`),
  getRecommendations: (farmId, category) => {
    const params = new URLSearchParams();
    if (farmId) params.append("farm_id", farmId);
    if (category) params.append("category", category);
    const qs = params.toString();
    return apiClient.get(`/schemes/recommended${qs ? `?${qs}` : ""}`);
  },
  explain: (id, payloadOrLang = "en") => {
    const body =
      typeof payloadOrLang === "object"
        ? payloadOrLang
        : { language: payloadOrLang, question: null };
    return apiClient.post(`/schemes/${id}/explain`, body);
  },
};

export default schemesApi;
