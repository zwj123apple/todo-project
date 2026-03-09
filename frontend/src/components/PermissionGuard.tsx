import type { ReactNode } from "react";
import { usePermission } from "../hooks/usePermission";

interface PermissionGuardProps {
  /**
   * 需要的角色
   */
  role?: string;

  /**
   * 需要的角色列表(满足任意一个即可)
   */
  roles?: string[];

  /**
   * 子组件
   */
  children: ReactNode;

  /**
   * 无权限时显示的内容
   */
  fallback?: ReactNode;
}

/**
 * 权限守卫组件
 * 用于根据用户权限控制组件的显示
 */
export const PermissionGuard = ({
  role,
  roles,
  children,
  fallback = null,
}: PermissionGuardProps) => {
  const { hasRole, hasAnyRole } = usePermission();

  // 检查单个角色
  if (role && !hasRole(role)) {
    return <>{fallback}</>;
  }

  // 检查多个角色
  if (roles && !hasAnyRole(roles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
