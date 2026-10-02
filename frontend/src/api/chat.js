import apiClient from "./client";

export const chatApi = {
  getSessions: () => apiClient.get("/chat/sessions"),
  createSession: (payload) => apiClient.post("/chat/sessions", payload),
  getMessages: (sessionId) => apiClient.get(`/chat/sessions/${sessionId}/messages`),
  getSessionMessages: (sessionId) => apiClient.get(`/chat/sessions/${sessionId}/messages`),
  deleteSession: (sessionId) => apiClient.delete(`/chat/sessions/${sessionId}`),
  sendMessage: (sessionId, payload, isFormData = false) =>
    apiClient.post(`/chat/sessions/${sessionId}/messages`, payload, isFormData),
  sendMessageDirect: (payload, isFormData = false) =>
    apiClient.post("/chat/message", payload, isFormData),
};

export default chatApi;
