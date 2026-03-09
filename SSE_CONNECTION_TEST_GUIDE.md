# SSE连接稳定性测试指南

## 已实现的修复功能

### 1. Token过期自动检查和刷新 ✅

- 在创建SSE连接前检查token是否在5分钟内过期
- 如果即将过期，自动调用refresh接口获取新token
- 使用新token创建SSE连接

### 2. 401错误智能处理 ✅

- 首次遇到401错误时，不是盲目重连
- 先尝试刷新token
- 刷新成功后，通过React状态更新触发重新连接
- 避免了用旧token不断重连的死循环

### 3. 连接前Token验证 ✅

- 每次创建连接前都会验证token有效性
- 如果token无效或刷新失败，中止连接并报错
- 保证只用有效token创建连接

### 4. 依赖优化 ✅

- useEffect依赖包含`accessToken`和`refreshToken`
- Token更新时会自动触发重新连接
- 避免手动管理连接状态

## 如何测试

### 测试1: 正常登录和连接

```bash
# 步骤
1. 启动后端服务: cd backend && mvn spring-boot:run
2. 启动前端服务: cd frontend && npm run dev
3. 访问 http://localhost:5173
4. 登录系统
5. 打开浏览器开发者工具控制台
```

**预期结果：**

- 看到 "SSE连接已建立" 日志
- 看到 "连接确认:" 日志
- 定期看到 "心跳:" 日志

### 测试2: Token即将过期时自动刷新

```bash
# 模拟方法（修改JWT过期时间为短时间）

# 方法1: 修改后端JWT过期时间
# backend/src/main/resources/application.yaml
jwt:
  secret:
```
