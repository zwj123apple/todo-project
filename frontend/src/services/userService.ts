import apiClient from "../lib/axios";
import type { ApiResponse, User } from "../types";

export const userService = {
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<ApiResponse<User>>("/users/me");
    return response.data.data;
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await apiClient.put<ApiResponse<User>>("/users/me", data);
    return response.data.data;
  },
};
