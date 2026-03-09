# 📝 管理员用户管理页面 - 使用指南

## ✅ 已完成功能

### 1. **路由配置**

- ✅ 路由路径: `/admin/users`
- ✅ 添加到 `frontend/src/router/index.tsx`
- ✅ 添加到 `frontend/src/config/index.ts` (ROUTES.ADMIN_USERS)
- ✅ 添加到侧边栏导航 (仅ADMIN可见)

### 2. **AdminUsersPage 功能**

- ✅ 用户列表展示
- ✅ 修改用户角色（USER/ADMIN）
- ✅ 修改用户状态（ACTIVE/INACTIVE/SUSPENDED）
- ✅ 删除用户
- ✅ Toast消息提示
- ✅ Loading状态
- ✅ 权限保护

### 3. **权限控制**

- ✅ 页面级权限控制（PermissionGuard）
- ✅ 导航菜单权限控制（仅ADMIN可见）
- ✅ 后端API权限控制（@PreAuthorize）

## 🚀 使用步骤

### 1. 创建管理员账号

```sql
-- 连接到PostgreSQL数据库
psql -U postgres -d tododb

-- 将现有用户设置为管理员
UPDATE users SET role = 'ADMIN' WHERE username = 'your_username';

-- 或者在注册后立即设置
UPDATE users SET role = 'ADMIN' WHERE email = 'admin@example.com';
```

### 2. 启动应用

```bash
# 后端
cd backend
./mvnw spring-boot:run

# 前端
cd frontend
npm run dev
```

### 3. 访问管理员页面

1. 登录管理员账号
2. 在侧边栏找到"管理员"分组
3. 点击"👥 用户管理"
4. 访问 `http://localhost:5173/admin/users`

## 📋 功能说明

### 用户列表

显示所有用户的信息：

- 用户名和邮箱
- 角色标签（USER/ADMIN）
- 状态标签（ACTIVE/INACTIVE/SUSPENDED）
- 注册时间
- 操作按钮

### 修改角色

1. 点击"修改角色"按钮
2. 在弹出的模态框中选择角色
   - USER: 普通用户
   - ADMIN: 管理员
3. 点击"确认"保存

### 修改状态

1. 点击"修改状态"按钮
2. 在弹出的模态框中选择状态
   - ACTIVE: 激活状态，可以正常登录
   - INACTIVE: 未激活，可能需要邮箱验证
   - SUSPENDED: 暂停状态，禁止登录
3. 点击"确认"保存

### 删除用户

1. 点击"删除"按钮
2. 确认删除操作
3. 用户将被永久删除

## 🔐 权限说明

### USER（普通用户）

- ❌ 无法访问 `/admin/users`
- ❌ 侧边栏不显示"管理员"菜单
- ✅ 只能管理自己的任务和文件

### ADMIN（管理员）

- ✅ 可以访问 `/admin/users`
- ✅ 可以查看所有用户
- ✅ 可以修改用户角色
- ✅ 可以修改用户状态
- ✅ 可以删除用户
- ✅ 拥有所有普通用户权限

## 🎨 界面预览

```
┌─────────────────────────────────────────────────────────┐
│  用户管理                                                │
│  管理系统中的所有用户                                    │
├─────────────────────────────────────────────────────────┤
│  用户        │ 角色   │ 状态    │ 注册时间    │ 操作    │
├─────────────────────────────────────────────────────────┤
│  admin       │ ADMIN  │ ACTIVE  │ 2024-01-01 │ 修改... │
│  admin@...   │        │         │            │         │
├─────────────────────────────────────────────────────────┤
│  user1       │ USER   │ ACTIVE  │ 2024-01-02 │ 修改... │
│  user1@...   │        │         │            │         │
└─────────────────────────────────────────────────────────┘
```

## 🔧 API端点

所有功能都通过以下后端API实现：

```
GET    /api/admin/users              - 获取所有用户列表
PUT    /api/admin/users/{id}/role    - 更新用户角色
PUT    /api/admin/users/{id}/status  - 更新用户状态
DELETE /api/admin/users/{id}         - 删除用户
```

## 🐛 故障排除

### 问题1: 无法访问管理员页面

**原因**: 当前用户不是管理员
**解决**:

```sql
UPDATE users SET role = 'ADMIN' WHERE username = 'your_username';
```

### 问题2: 侧边栏看不到"管理员"菜单

**原因**:

1. 用户不是管理员
2. PermissionGuard组件未正确配置

**解决**:

1. 确认用户角色为ADMIN
2. 检查Layout.tsx中的PermissionGuard配置

### 问题3: API返回403错误

**原因**: 后端权限控制拒绝访问

**解决**:

1. 确认JWT token正确
2. 确认用户角色为ADMIN
3. 检查后端SecurityConfig配置

### 问题4: 修改角色或状态后没有更新

**原因**: 前端缓存未刷新

**解决**:

- 代码已实现自动刷新（queryClient.invalidateQueries）
- 如果仍未更新，手动刷新页面

## 📦 相关文件

### 前端文件

- `frontend/src/pages/AdminUsersPage.tsx` - 主页面组件
- `frontend/src/services/adminService.ts` - API服务
- `frontend/src/router/index.tsx` - 路由配置
- `frontend/src/config/index.ts` - 路由常量
- `frontend/src/components/Layout.tsx` - 导航菜单
- `frontend/src/hooks/usePermission.ts` - 权限Hook
- `frontend/src/components/PermissionGuard.tsx` - 权限守卫

### 后端文件

- `backend/src/main/java/com/example/backend/controller/AdminController.java` - 管理员API
- `backend/src/main/java/com/example/backend/service/UserService.java` - 用户服务
- `backend/src/main/java/com/example/backend/
