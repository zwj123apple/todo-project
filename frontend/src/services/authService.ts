import apiClient from "../lib/axios";
import type {
  ApiResponse,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
} from "../types";

export const authService = {
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      "/auth/register",
      data,
    );
    return response.data.data;
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      "/auth/login",
      data,
    );
    return response.data.data;
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      "/auth/refresh",
      {
        refreshToken,
      },
    );
    return response.data.data;
  },
};
