import apiClient from "./client";

export const usersApi = {
  getMe: () => apiClient.get("/users/me"),
  updateMe: (data) => apiClient.put("/users/me", data),
};

export default usersApi;
