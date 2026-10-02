import apiClient from "./client";

export const cropDoctorApi = {
  getDiagnoses: (cropId) => apiClient.get(`/crops/${cropId}/diagnoses`),
  diagnose: (cropId, formData) => apiClient.post(`/crops/${cropId}/diagnoses`, formData, true),
};

export default cropDoctorApi;
