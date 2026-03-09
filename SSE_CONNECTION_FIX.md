# SSE连接稳定性修复

## 问题描述

SSE（Server-Sent Events）连接在使用一段时间后会出现401未授权错误，导致连接不稳定。主要表现为：

- 刚登录时SSE连接正常
- 切换菜单或使用一段时间后，SSE连接开始报401错误
- 连接不断尝试重连但都失败

## 根本原因

1. **Token过期**：JWT token有过期时间（通常1小时），SSE连接使用URL参数传递token
2. **缺少刷新机制**：SSE连接没有检查token是否即将过期，也没有在401错误时刷新token
3. **重连策略问题**：当收到401错误时，直接用旧token重连，导致一直失败

## 修复方案

### 1. Token过期检查

在创建SSE连接前，检查token是否即将过期（5分钟内）：

```typescript
const isTokenExpiringSoon = (token: string) => {
  const payload = JSON.parse(atob(token.split(".")[1]));
  const exp = payload.exp * 1000;
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;
  return exp - now < fiveMinutes;
};
```

### 2. 自动刷新Token

如果token即将过期，在创建连接前自动刷新：

```typescript
const ensureValidToken = async () => {
  if (isTokenExpiringSoon(accessToken)) {
    const response = await refreshAccessToken();
    if (response) {
      setAuth(response.user, response.accessToken, response.refreshToken);
      return response.accessToken;
    }
  }
  return accessToken;
};
```

### 3. 401错误处理

当SSE连接收到401错误时，先刷新token再重连：

```typescript
if (isUnauthorized && reconnectAttemptsRef.current === 1) {
  console.log("检测到401错误，尝试刷新token...");
  const response = await refreshAccessToken();
  if (response) {
    setAuth(response.user, response.accessToken, response.refreshToken);
    // token更新后会触发useEffect重新创建连接
  }
  return;
}
```

### 4. 优化连接创建流程

```typescript
const createConnection = () => {
  ensureValidToken().then((validToken) => {
    if (validToken) {
      createEventSourceConnection(validToken);
    }
  });
};
```

## 修改的文件

1. **frontend/src/hooks/useEventSource.ts**
   - 添加token过期检查
   - 添加自动刷新token逻辑
   - 优化401错误处理
   - 改进重连策略

2. **frontend/src/services/authService.ts**
   - 导出refreshToken函数供其他模块使用

## 测试验证

### 测试步骤

1. **正常登录测试**

   ```bash
   # 登录后检查SSE连接
   - 打开浏览器控制台
   - 查看"SSE连接已建立"日志
   ```

2. **Token即将过期测试**

   ```bash
   # 等待token接近过期时间
   - 观察是否有"Token即将过期，正在刷新..."日志
   - 确认连接没有中断
   ```

3. **切换菜单测试**

   ```bash
   # 在应用中切换不同页面
   - 观察SSE连接是否保持稳定
   - 确认没有401错误
   ```

4. **长时间使用测试**
   ```bash
   # 保持应用打开超过1小时
   - 确认token自动刷新
   - 确认SSE连接持续稳定
   ```

## 预期效果

修复后的SSE连接应该能够：

- ✅ 在token即将过期时自动刷新
- ✅ 遇到401错误时智能处理而非盲目重连
- ✅ 长时间保持稳定连接（超过1小时）
- ✅ 切换页面时连接不中断
- ✅ 避免401错误的重连死循环

**状态：所有功能已实现并可以测试 ✅**
