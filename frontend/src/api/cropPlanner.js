import apiClient from "./client";

export const cropPlannerApi = {
  suggest: (arg1, arg2) => {
    const payload = typeof arg1 === "object" ? arg1 : { farm_id: arg1, season: arg2 };
    return apiClient.post("/crop-planner/suggest", payload);
  },
  aiRecommend: (payload) => apiClient.post("/crop-planner/ai-recommend", payload),
  getPlans: (farmId) => apiClient.get(`/crop-planner/plans${farmId ? `?farm_id=${farmId}` : ""}`),
  savePlan: (data) => apiClient.post("/crop-planner/plans", data),
  convertPlan: (planId, data = {}) => apiClient.post(`/crop-planner/plans/${planId}/convert`, data),
  startCrop: (planId, data = {}) => apiClient.post(`/crop-planner/plans/${planId}/convert`, data),
  deletePlan: (planId) => apiClient.delete(`/crop-planner/plans/${planId}`),
};

export default cropPlannerApi;
