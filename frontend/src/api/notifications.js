import apiClient from "./client";

export const notificationsApi = {
  list: (unreadOnly = false) => apiClient.get(`/notifications${unreadOnly ? "?unread_only=true" : ""}`),
  markRead: (id) => apiClient.patch(`/notifications/${id}/read`),
  markAsRead: (id) => apiClient.patch(`/notifications/${id}/read`),
};

export default notificationsApi;
