import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45000, // Gemini calls can take a while, especially for images
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      (error.code === "ECONNABORTED"
        ? "The request took too long. Please try again."
        : "Network error. Please check your connection and try again.");
    return Promise.reject(new Error(message));
  }
);

export async function diagnoseImage(file, { cropType, language }) {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("cropType", cropType);
  formData.append("language", language);

  const { data } = await apiClient.post("/diagnose/image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.data;
}

export async function diagnoseSymptoms({ symptoms, cropType, language }) {
  const { data } = await apiClient.post("/diagnose/symptoms", {
    symptoms,
    cropType,
    language,
  });
  return data.data;
}

export async function fetchSchemes({ state, crop, language }) {
  const { data } = await apiClient.post("/schemes", { state, crop, language });
  return data.data;
}

export async function checkHealth() {
  const { data } = await apiClient.get("/health");
  return data.data;
}
