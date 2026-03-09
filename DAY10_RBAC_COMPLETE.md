# Day 10: Spring Security 权限控制 - 完成文档

## ✅ 完成内容

### 1. 角色系统

- **UserRole枚举**: USER, ADMIN (已存在)
- **UserStatus枚举**: ACTIVE, INACTIVE, SUSPENDED
- User实体已包含role和status字段

### 2. Spring Security配置

- **@EnableMethodSecurity**: 启用方法级权限控制
- **SecurityConfig**: 配置了/api/admin/\*\*路径需要ADMIN角色
- **CustomUserDetailsService**: 正确加载用户角色权限

### 3. 管理员功能

创建了`AdminController`,包含以下API:

#### 管理员API

- `GET /api/admin/users` - 获取所有用户列表
- `PUT /api/admin/users/{userId}/role` - 更新用户角色
- `PUT /api/admin/users/{userId}/status` - 更新用户状态
- `DELETE /api/admin/users/{userId}` - 删除用户
- `GET /api/admin/statistics` - 获取系统统计信息

所有接口都使用`@PreAuthorize("hasRole('ADMIN')")`保护

### 4. UserService扩展

添加管理员专用方法:

- `getAllUsers()` - 获取所有用户
- `updateUserRole()` - 更新用户角色
- `updateUserStatus()` - 更新用户状态
- `deleteUser()` - 删除用户

## 🔐 权限控制机制

### URL级别权限

```java
.requestMatchers("/api/auth/**").permitAll()
.requestMatchers("/api/admin/**").hasRole("ADMIN")
.anyRequest().authenticated()
```

### 方法级别权限

```java
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<ApiResponse<List<UserDTO>>> getAllUsers() {
    // 只有ADMIN角色可以访问
}
```

## 📝 角色说明

### USER (普通用户)

- 可以管理自己的任务
- 可以上传文件
- 可以查看自己的统计数据
- 不能访问管理员功能

### ADMIN (管理员)

- 拥有所有USER权限
- 可以查看所有用户
- 可以修改用户角色和状态
- 可以删除用户
- 可以查看系统级统计

## 🧪 测试方法

### 1. 创建管理员用户

需要在数据库中手动将某个用户的role设置为ADMIN:

```sql
UPDATE users SET role = 'ADMIN' WHERE username = 'admin';
```

### 2. 测试权限控制

```bash
# 普通用户访问管理员API (应该返回403)
curl -H "Authorization: Bearer <user_token>" \
  http://localhost:8080/api/admin/users

# 管理员访问管理员API (应该返回200)
curl -H "Authorization: Bearer <admin_token>" \
  http://localhost:8080/api/admin/users
```

### 3. 测试管理员功能

```bash
# 获取所有用户
GET /api/admin/users

# 修改用户角色
PUT /api/admin/users/1/role?role=ADMIN

# 修改用户状态
PUT /api/admin/users/1/status?status=SUSPENDED

# 删除用户
DELETE /api/admin/users/1
```

## 🔄 下一步: Day 11

前端权限控制:

1. 创建权限检查Hook
2. 实现权限指令组件
3. 添加错误边界
4. 路由权限保护
5. 优雅处理403错误

## 📚 相关文件

### 后端

- `backend/src/main/java/com/example/backend/entity/User.java`
- `backend/src/main/java/com/example/backend/config/SecurityConfig.java`
- `backend/src/main/java/com/example/backend/security/CustomUserDetailsService.java`
- `backend/src/main/java/com/example/backend/controller/AdminController.java`
- `backend/src/main/java/com/example/backend/service/UserService.java`

### 前端 (Day 11待完成)

- 权限Hook
- 权限组件
- 错误边界
- 路由保护
