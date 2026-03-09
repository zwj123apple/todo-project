import { useAuthStore } from "../stores/authStore";

/**
 * 权限检查Hook
 * 用于判断当前用户是否有特定权限
 */
export const usePermission = () => {
  const { user } = useAuthStore();

  /**
   * 检查是否有指定角色
   */
  const hasRole = (role: string): boolean => {
    if (!user) return false;
    return user.role === role;
  };

  /**
   * 检查是否是管理员
   */
  const isAdmin = (): boolean => {
    return hasRole("ADMIN");
  };

  /**
   * 检查是否是普通用户
   */
  const isUser = (): boolean => {
    return hasRole("USER");
  };

  /**
   * 检查是否有任意一个角色
   */
  const hasAnyRole = (roles: string[]): boolean => {
    if (!user) return false;
    return roles.some((role) => user.role === role);
  };

  return {
    hasRole,
    isAdmin,
    isUser,
    hasAnyRole,
  };
};
