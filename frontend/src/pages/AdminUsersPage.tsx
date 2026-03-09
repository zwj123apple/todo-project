import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/axios";
import { PermissionGuard } from "../components/PermissionGuard";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

interface User {
  id: number;
  username: string;
  email: string;
  nickname: string;
  role: string;
  status: string;
  createdAt: string;
}

/**
 * 管理员 - 用户管理页面
 */
export const AdminUsersPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("USER");
  const [selectedStatus, setSelectedStatus] = useState<string>("ACTIVE");

  // 获取所有用户
  const { data: users, isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const response = await apiClient.get<{ data: User[] }>(
        "/api/admin/users",
      );
      return response.data.data;
    },
  });

  // 更新用户角色
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      await apiClient.put(`/api/admin/users/${userId}/role?role=${role}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setShowRoleModal(false);
      setSelectedUser(null);
      toast.success("用户角色已更新");
    },
    onError: () => {
      toast.error("更新用户角色失败");
    },
  });

  // 更新用户状态
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      userId,
      status,
    }: {
      userId: number;
      status: string;
    }) => {
      await apiClient.put(`/api/admin/users/${userId}/status?status=${status}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setShowStatusModal(false);
      setSelectedUser(null);
      toast.success("用户状态已更新");
    },
    onError: () => {
      toast.error("更新用户状态失败");
    },
  });

  // 删除用户
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiClient.delete(`/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("用户已删除");
    },
    onError: () => {
      toast.error("删除用户失败");
    },
  });

  const handleDeleteUser = (user: User) => {
    if (window.confirm(`确定要删除用户 "${user.username}" 吗？`)) {
      deleteUserMutation.mutate(user.id);
    }
  };

  const handleUpdateRole = () => {
    if (selectedUser) {
      updateRoleMutation.mutate({
        userId: selectedUser.id,
        role: selectedRole,
      });
    }
  };

  const handleUpdateStatus = () => {
    if (selectedUser) {
      updateStatusMutation.mutate({
        userId: selectedUser.id,
        status: selectedStatus,
      });
    }
  };

  const openRoleModal = (user: User) => {
    setSelectedUser(user);
    setSelectedRole(user.role);
    setShowRoleModal(true);
  };

  const openStatusModal = (user: User) => {
    setSelectedUser(user);
    setSelectedStatus(user.status);
    setShowStatusModal(true);
  };

  return (
    <PermissionGuard
      role="ADMIN"
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              无权限访问
            </h2>
            <p className="text-gray-600 mb-6">您没有权限访问此页面</p>
            <button
              onClick={() => navigate("/tasks")}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              返回首页
            </button>
          </div>
        </div>
      }
    >
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">用户管理</h1>
          <p className="text-gray-600 mt-2">管理系统中的所有用户</p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    用户
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    角色
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    注册时间
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users?.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.username}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role === "ADMIN"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.status === "ACTIVE"
                            ? "bg-green-100 text-green-800"
                            : user.status === "SUSPENDED"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString("zh-CN")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openRoleModal(user)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        修改角色
                      </button>
                      <button
                        onClick={() => openStatusModal(user)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        修改状态
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user)}
                        className="text-red-600 hover:text-red-900"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 修改角色模态框 */}
        {showRoleModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96">
              <h3 className="text-lg font-semibold mb-4">修改用户角色</h3>
              <p className="text-sm text-gray-600 mb-4">
                用户: {selectedUser.username}
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择角色
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="USER">USER - 普通用户</option>
                  <option value="ADMIN">ADMIN - 管理员</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setShowRoleModal(false);
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleUpdateRole}
                  disabled={updateRoleMutation.isPending}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {updateRoleMutation.isPending ? "更新中..." : "确认"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 修改状态模态框 */}
        {showStatusModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96">
              <h3 className="text-lg font-semibold mb-4">修改用户状态</h3>
              <p className="text-sm text-gray-600 mb-4">
                用户: {selectedUser.username}
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择状态
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ACTIVE">ACTIVE - 激活</option>
                  <option value="INACTIVE">INACTIVE - 未激活</option>
                  <option value="SUSPENDED">SUSPENDED - 暂停</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setShowStatusModal(false);
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleUpdateStatus}
                  disabled={updateStatusMutation.isPending}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {updateStatusMutation.isPending ? "更新中..." : "确认"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
};
