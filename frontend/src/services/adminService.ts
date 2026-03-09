import { apiClient } from "../lib/axios";

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  nickname: string;
  role: string;
  status: string;
  createdAt: string;
  lastLoginAt?: string;
}

/**
 * 管理员服务
 */
export const adminService = {
  /**
   * 获取所有用户
   */
  getAllUsers: async (): Promise<AdminUser[]> => {
    const response = await apiClient.get<{ data: AdminUser[] }>(
      "/api/admin/users",
    );
    return response.data.data;
  },

  /**
   * 更新用户角色
   */
  updateUserRole: async (userId: number, role: string): Promise<void> => {
    await apiClient.put(`/api/admin/users/${userId}/role?role=${role}`);
  },

  /**
   * 更新用户状态
   */
  updateUserStatus: async (userId: number, status: string): Promise<void> => {
    await apiClient.put(`/api/admin/users/${userId}/status?status=${status}`);
  },

  /**
   * 删除用户
   */
  deleteUser: async (userId: number): Promise<void> => {
    await apiClient.delete(`/api/admin/users/${userId}`);
  },
};
