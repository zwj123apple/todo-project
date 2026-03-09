# SSE连接调试指南

## 紧急修复

### 错误修正

我之前错误地将URL改为`/notifications/subscribe`，正确的应该是：

- ✅ 正确端点：`/api/notifications/stream`
- ❌ 错误端点：`/notifications/subscribe`

已修复！

## 立即调试步骤

### 步骤1：检查SSE连接

打开浏览器开发者工具（F12）：

```bash
# 1. Network标签
- 筛选：All 或 WS
- 查找：stream
- 应该看到：/api/notifications/stream?token=...
- Status：pending (一直保持)
- Type：eventsource

# 2. Console标签
应该看到以下日志：
✅ "SSE连接已建立"
✅ "连接确认: SSE连接已建立"
```

### 步骤2：检查Token

```javascript
// 在Console中执行
localStorage.getItem("access_token");
// 应该返回一个JWT token字符串

// 检查SSE URL
console.log(
  `http://localhost:8080/api/notifications/stream?token=${localStorage.getItem("access_token")}`,
);
```

### 步骤3：测试任务状态变更

```bash
# 操作流程：
1. 打开任务列表页面
2. 确保Console显示"SSE连接已建立"
3. 改变任务状态（下拉框）
4. 观察Console输出

# 应该看到：
Console日志：
- "任务更新: {type: 'task_updated', message: '任务已更新', ...}"
或
- "任务状态变更: {type: 'task_status_changed', ...}"

# 应该看到Toast：
- 屏幕右上角出现通知卡片
- 黄色边框（任务更新）或绿色边框（状态变更）
```

### 步骤4：检查后端日志

```bash
# 后端控制台应该显示：
INFO - 用户 1 建立SSE连接
DEBUG - 向用户 1 发送通知: task_updated
```

## 常见问题快速排查

### ❌ 问题1：Network中没有/stream连接

**原因：**

- Token未设置
- URL路径错误
- 用户未登录

**解决：**

```javascript
// 检查
console.log("Token:", localStorage.getItem("access_token"));
console.log("User:", localStorage.getItem("user"));

// 如果没有，重新登录
```

### ❌ 问题2：连接显示failed或404

**原因：**

- 后端未启动
- 端口错误
- 路径不匹配

**解决：**

```bash
# 确认后端运行在8080端口
curl http://localhost:8080/api/notifications/stream

# 检查SecurityConfig是否允许/api/notifications/**
```

### ❌ 问题3：连接成功但没有收到消息

**原因：**

- 事件监听器未设置
- 事件名称不匹配
- 后端未发送通知

**解决：**

```typescript
// 检查useEventSource.ts中的事件监听器
eventSource.addEventListener("task_updated", ...)  // 必须存在
eventSource.addEventListener("task_status_changed", ...)  // 必须存在
```

### ❌ 问题4：收到消息但没有Toast

**原因：**

- NotificationToast组件未挂载
- handleMessage未正确处理
- Toast样式问题

**解决：**

```tsx
// 检查App.tsx
<NotificationToast />; // 必须存在且不能被条件渲染隐藏

// 在NotificationToast.tsx中添加调试日志
useEffect(() => {
  console.log("NotificationToast mounted");
  console.log("Notifications:", notifications);
}, [notifications]);
```

## 详细诊断脚本

在浏览器Console中执行以下脚本进行全面诊断：

```javascript
// SSE连接诊断脚本
(function () {
  console.log("=== SSE连接诊断 ===");

  // 1. 检查Token
  const token = localStorage.getItem("access_token");
  console.log("1. Token存在:", !!token);
  if (token) {
    console.log("   Token前缀:", token.substring(0, 20) + "...");
  }

  // 2. 检查用户
  const user = localStorage.getItem("user");
  console.log("2. 用户信息:", user ? JSON.parse(user) : null);

  // 3. 检查SSE连接
  console.log("3. 检查Network标签中的/stream连接");
  console.log(
    "   URL应该是: http://localhost:8080/api/notifications/stream?token=...",
  );

  // 4. 测试API端点
  console.log("4. 测试后端连接...");
  fetch("http://localhost:8080/api/tasks", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((r) => console.log("   API连接正常:", r.ok))
    .catch((e) => console.error("   API连接失败:", e));

  // 5. 手动创建SSE测试
  console.log("5. 尝试手动创建SSE连接...");
  const testUrl = `http://localhost:8080/api/notifications/stream?token=${encodeURIComponent(token)}`;
  console.log("   连接URL:", testUrl);

  const testES = new EventSource(testUrl);
  testES.onopen = () => console.log("✅ SSE测试连接成功");
  testES.onerror = (e) => console.error("❌ SSE测试连接失败:", e);
  testES.onmessage = (e) => console.log("📨 收到消息:", e.data);

  // 10秒后关闭测试连接
  setTimeout(() => {
    testES.close();
    console.log("测试连接已关闭");
  }, 10000);

  console.log("=== 诊断完成，请查看上面的输出 ===");
})();
```

## SecurityConfig检查

确保后端Spring Security配置允许SSE端点：

```java
.requestMatchers("/api/notifications/**").authenticated()
// 或者如果使用自定义过滤器
.requestMatchers("/api/notifications/stream").permitAll()
```

## 完整验证流程

```bash
### 步骤A：重启服务
1. 停止前端和后端
2. 清理浏览器缓存和localStorage
3. 重启后端: cd backend && mvn spring-boot:run
4. 重启前端: cd frontend && npm run dev

### 步骤B：登录并验证
1. 打开 http://localhost:5173/login
2. 登录系统
3. F12打开开发者工具
4. 切换到Network标签
5. 导航到任务列表页面
6. 确认看到/api/notifications/stream连接（pending状态）

### 步骤C：测试通知
1. 在Console中查看"SSE连接已建立"日志
2. 改变一个任务的状态
3. 观察：
   - Console应该输出："任务更新: ..."
   - 右上角应该出现Toast通知
   - Toast应该5秒后消失

### 步骤D：后端验证
在后端控制台查看：
- INFO - 用户 X 建立SSE连接
- DEBUG - 向用户 X 发送通知: task_updated
```

## URL配置总结

### 正确配置 ✅

```
后端: @RequestMapping("/api/notifications") + @GetMapping("/stream")
完整: /api/notifications/stream
前端: useEventSource("/api/notifications/stream")
```

### 错误配置 ❌

```
前端: useEventSource("/notifications/subscribe")  // 路径错误
前端: useEventSource("/subscribe")  // 缺少/api前缀
```

## 下一步行动

1. 刷新浏览器页面
2. 打开F12开发者工具
3. 切换到Console标签
4. 执行上面的诊断脚本
5. 尝试改变任务状态
6. 将Console和Network的截图发给我

如果还是不行，请提供：

- Console中的所有日志
- Network中/stream连接的详细信息
- 后端控制台的日志输出
