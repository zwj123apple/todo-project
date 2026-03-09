# JWT 认证和 Refresh Token 实现说明

## ✅ 已实现的功能

### 1. **Axios 拦截器** (`frontend/src/lib/axios.ts`)

#### 请求拦截器

- ✅ 自动在每个请求头中添加 `Authorization: Bearer <token>`
- ✅ 从 localStorage 读取 accessToken

#### 响应拦截器 (Token 刷新机制)

- ✅ 检测 401 未授权错误
- ✅ 自动使用 refreshToken 刷新 accessToken
- ✅ 请求队列机制：当刷新 token 时，暂停其他请求，刷新完成后重试
- ✅ 刷新失败时自动清除本地存储并跳转到登录页

### 2. **认证服务** (`frontend/src/services/authService.ts`)

- ✅ 注册接口
- ✅ 登录接口
- ✅ 刷新 token 接口

### 3. **状态管理** (`frontend/src/stores/authStore.ts`)

- ✅ Zustand store 管理用户状态
- ✅ 持久化到 localStorage
- ✅ `setAuth()` - 保存用户信息和 tokens
- ✅ `clearAuth()` - 清除认证信息
- ✅ `updateUser()` - 更新用户信息

### 4. **登录/注册页面**

- ✅ `LoginPage.tsx` - 完整的登录表单
- ✅ `RegisterPage.tsx` - 完整的注册表单
- ✅ 登录/注册成功后自动跳转到 Dashboard
- ✅ 错误处理和显示

## 🔄 Token 刷新流程

```
1. 用户发起 API 请求
   ↓
2. 请求拦截器添加 Authorization header
   ↓
3. 后端返回 401 (token 过期)
   ↓
4. 响应拦截器捕获 401 错误
   ↓
5. 使用 refreshToken 调用 /auth/refresh
   ↓
6. 获取新的 accessToken 和 refreshToken
   ↓
7. 更新 localStorage
   ↓
8. 重试原始请求
   ↓
9. 返回结果给用户
```

## 📦 存储结构

### LocalStorage Keys

- `todopro_access_token` - JWT 访问令牌
- `todopro_refresh_token` - 刷新令牌
- `todopro_user` - 用户信息 (Zustand persist)

## 🧪 测试步骤

### 1. 启动应用

```bash
# 启动后端和数据库
cd c:\full-stack\todo-project
docker-compose up -d

# 启动前端
cd frontend
npm run dev
```

### 2. 测试注册

1. 访问 `http://localhost:5173/register`
2. 填写表单：
   - 用户名: testuser2
   - 邮箱: test2@example.com
   - 密码: password123
   - 昵称: 测试用户2
3. 点击注册
4. 应该自动跳转到 Dashboard

### 3. 测试登录

1. 访问 `http://localhost:5173/login`
2. 使用测试账号登录：
   - 用户名: `testuser` 或 邮箱: `test@todopro.com`
   - 密码: `user123`
3. 点击登录
4. 应该自动跳转到 Dashboard

### 4. 测试 Token 刷新

1. 打开浏览器开发者工具 -> Network 标签
2. 登录后，等待 accessToken 过期（默认1小时）
3. 或者手动修改 localStorage 中的 accessToken 为无效值
4. 发起任何 API 请求（如查看任务列表）
5. 观察 Network：
   - 第一个请求返回 401
   - 自动调用 `/auth/refresh`
   - 获取新 token
   - 重试原始请求成功

### 5. 测试登出

1. 在任何页面点击登出按钮
2. 应该清除所有本地存储
3. 跳转到登录页

## 🔧 配置文件

### `frontend/src/config/index.ts`

```typescript
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

export const STORAGE_KEYS = {
  ACCESS_TOKEN: "todopro_access_token",
  REFRESH_TOKEN: "todopro_refresh_token",
  USER: "todopro_user",
};

export const ROUTES = {
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/dashboard",
  TASKS: "/tasks",
  // ...
};
```

## 🐛 调试技巧

### 查看当前 Token

```javascript
// 在浏览器控制台运行
console.log("Access Token:", localStorage.getItem("todopro_access_token"));
console.log("Refresh Token:", localStorage.getItem("todopro_refresh_token"));
console.log("User:", localStorage.getItem("todopro_user"));
```

### 清除所有认证信息

```javascript
// 在浏览器控制台运行
localStorage.clear();
window.location.reload();
```

### 手动触发 Token 刷新

```javascript
// 将 accessToken 改为无效值
localStorage.setItem("todopro_access_token", "invalid_token");
// 然后发起任何 API 请求，会自动刷新
```

## 📝 后端 API 端点

### 认证相关

- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录
- `POST /api/auth/refresh` - 刷新 token
- `POST /api/auth/logout` - 登出（可选）

### 请求格式

#### 登录

```json
POST /api/auth/login
{
  "usernameOrEmail": "testuser",
  "password": "user123"
}
```

#### 刷新 Token

```json
POST /api/auth/refresh
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI..."
}
```

#### 响应格式

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "test@todopro.com",
      "nickname": "测试用户",
      "role": "USER",
      "status": "ACTIVE"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI..."
  },
  "message": "登录成功"
}
```

## ✨ 最佳实践

1. **Token 存储**
   - ✅ AccessToken 和 RefreshToken 分别存储
   - ✅ 使用 localStorage（也可考虑 httpOnly cookies 更安全）

2. **安全性**
   - ✅ 使用 HTTPS（生产环境）
   - ✅ Token 有过期时间
   - ✅ RefreshToken 过期后需要重新登录

3. **用户体验**
   - ✅ Token 刷新对用户透明
   - ✅ 刷新失败自动跳转登录
   - ✅ 请求队列避免重复刷新

## 🎯 常见问题

### Q: Token 刷新失败怎么办？

A: 会自动清除本地存储并跳转到登录页，用户需要重新登录。

### Q: 如何延长登录时间？

A: 修改后端的 token 过期时间：

- `jwt.access-token-expiration` - AccessToken 过期时间
- `jwt.refresh-token-expiration` - RefreshToken 过期时间

### Q: 如何实现"记住我"功能？

A: 可以延长 RefreshToken 的过期时间，或使用 cookies 存储。

### Q: 多标签页同步问题？

A: 目前使用 localStorage，多标签页会自动同步。可以监听 `storage` 事件实现更好的同步。

## 🚀 下一步优化

1. [ ] 添加 Token 过期倒计时提示
2. [ ] 实现多设备登录管理
3. [ ] 添加登出后的 Token 黑名单
4. [ ] 使用 httpOnly cookies 存储 token（更安全）
5. [ ] 添加 CSRF 保护
6. [ ] 实现 SSO（单点登录）
