# SSE实时通知Toast故障排查

## 问题诊断结果

经过详细检查，发现了关键问题：

### ❌ 问题1：SSE端点URL不匹配

**前端配置：**

```typescript
// frontend/src/hooks/useEventSource.ts - useNotifications()
const { isConnected, error } = useEventSource("/api/notifications/stream", {
  onMessage: handleMessage,
});
```

**后端端点：**

```java
// backend/.../NotificationController.java
@GetMapping("/subscribe")
public SseEmitter subscribe(@AuthenticationPrincipal UserDetails userDetails)
```

**实际端点URL：** `/notifications/subscribe`  
**前端请求URL：** `/api/notifications/stream` ❌

### ✅ 修复方案

**已修复：** 将前端URL改为匹配后端端点

```typescript
const { isConnected, error } = useEventSource("/notifications/subscribe", {
  onMessage: handleMessage,
});
```

## 完整架构验证

### 后端SSE实现 ✅

**NotificationController.java:**

```java
@GetMapping("/subscribe")
public SseEmitter subscribe(@AuthenticationPrincipal UserDetails userDetails) {
    // 创建SSE连接
    return notificationService.createEmitter(userId);
}
```

**NotificationService.java:**

- ✅ 创建SSE连接
- ✅ 管理多个用户连接 (ConcurrentHashMap)
- ✅ 发送任务创建/更新/删除/状态变更通知
- ✅ 心跳机制
- ✅ 自动清理断开的连接

**TaskService.java:**

- ✅ `createTask()` - 调用 `notificationService.notifyTaskCreated()`
- ✅ `updateTask()` - 调用 `notificationService.notifyTaskUpdated()`
- ✅ `deleteTask()` - 调用 `notificationService.notifyTaskDeleted()`

### 前端SSE实现 ✅

**App.tsx:**

```tsx
<NotificationToast /> // ✅ 组件已挂载
```

**NotificationToast.tsx:**

- ✅ 使用 `useNotifications()` hook
- ✅ 显示通知卡片
- ✅ 5秒自动关闭
- ✅ 支持手动关闭
- ✅ 连接状态指示器
- ✅ 不同类型不同颜色和图标

**useEventSource.ts:**

- ✅ 建立EventSource连接
- ✅ Token认证（URL参数）
- ✅ 自动重连机制
- ✅ 监听自定义事件类型
- ✅ 心跳处理

## 测试步骤

### 1. 检查SSE连接是否建立

```bash
# 方法1：浏览器开发者工具
1. 打开浏览器F12
2. 切换到Network标签
3. 筛选：WS (WebSocket/EventSource)
4. 查找：/notifications/subscribe
5. 状态应该显示：pending (保持连接)
6. Type应该显示：eventsource

# 方法2：查看控制台日志
浏览器Console应该看到：
- "SSE连接已建立"
- "连接确认: SSE连接已建立"
```

### 2. 检查后端日志

```bash
# 启动后端时应该看到：
INFO - 用户 1 建立SSE连接

# 创建/更新任务时应该看到：
DEBUG - 向用户 1 发送通知: task_created
DEBUG - 向用户 1 发送通知: task_updated
```

### 3. 测试任务通知

```bash
# 测试场景：创建任务
1. 登录系统
2. 等待2秒确保SSE连接建立
3. 创建一个新任务
4. 应该立即看到toast通知："新任务已创建"

# 测试场景：更新任务
1. 修改任务标题或描述
2. 保存
3. 应该看到toast通知："任务已更新"

# 测试场景：状态变更
1. 将任务从"待办"改为"进行中"
2. 应该看到toast通知："任务状态从 TODO 变更为 IN_PROGRESS"

# 测试场景：删除任务
1. 删除一个任务
2. 应该看到toast通知："任务已删除"
```

### 4. 验证Toast显示

Toast通知应该：

- ✅ 出现在屏幕右上角
- ✅ 有颜色边框（蓝/黄/红/绿）
- ✅ 有对应图标
- ✅ 显示消息内容
- ✅ 5秒后自动消失
- ✅ 可以手动点击X关闭

## 常见问题排查

### 问题1：Network中没有/subscribe连接

**可能原因：**

1. 用户未登录
2. Token无效
3. URL路径错误

**解决方法：**

```javascript
// 检查localStorage中是否有token
console.log(localStorage.getItem("access_token"));

// 检查useEventSource中的URL
// 应该是：/notifications/subscribe
```

### 问题2：连接建立但没有toast

**可能原因：**

1. NotificationToast组件未挂载
2. 事件监听器未正确设置
3. 消息格式解析失败

**解决方法：**

```typescript
// 检查App.tsx
<NotificationToast />  // 必须存在

// 检查浏览器Console
// 应该看到："任务创建: {data}"
// 如果没有，说明事件监听器有问题
```

### 问题3：后端发送但前端未收到

**可能原因：**

1. 事件名称不匹配
2. 数据格式错误
3. CORS问题

**解决方法：**

```java
// 检查NotificationService发送的事件名
.name("task_created")  // 必须匹配

// 检查前端监听的事件名
eventSource.addEventListener("task_created", ...)  // 必须匹配
```

### 问题4：Toast显示异常

**可能原因：**

1. CSS样式冲突
2. z-index层级问题
3. 动画效果未生效

**解决方法：**

```tsx
// 检查NotificationToast的className
className = "fixed top-4 right-4 z-50"; // z-50确保在最上层
```

## 配置检查清单

- [x] 后端NotificationController端点：`/notifications/subscribe`
- [x] 前端useEventSource URL：`/notifications/subscribe`
- [x] App.tsx包含`<NotificationToast />`
- [ ] SecurityConfig允许SSE端点访问
- [ ] TaskService调用通知服务
- [ ] 事件名称前后端一致
- [ ] Token正确传递

## SecurityConfig配置

确保Spring Security允许SSE端点：

```java
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/notifications/subscribe").authenticated()  // SSE端点需要认证
            // 或者如果使用自定义认证过滤器：
            .requestMatchers("/notifications/**").permitAll()
        );
    return http.build();
}
```

## 环境变量配置

### 前端 (.env)

```bash
VITE_API_URL=http://localhost:8080
```

### 后端 (application.yaml)

```yaml
spring:
  mvc:
    async:
      request-timeout: 300000 # SSE超时时间：5分钟
```

## 调试技巧

### 1. 启用详细日志

**前端：**

```typescript
// useEventSource.ts
console.log("SSE连接已建立");
console.log("收到SSE消息:", event.data);
```

**后端：**

```yaml
logging:
  level:
    com.example.backend.service.NotificationService: DEBUG
    com.example.backend.controller.NotificationController: DEBUG
```

### 2. 使用curl测试SSE

```bash
# 测试SSE端点
curl -N -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8080/notifications/subscribe

# 应该看到：
event:connected
data:SSE连接已建立

# 然后在另一个终端创建任务，应该看到：
event:task_created
{"type":"task_created","message":"新任务已创建","task":{...}}
```

### 3. 浏览器断点调试

```javascript
// 在NotificationToast.tsx中设置断点
const handleMessage = useCallback((event: MessageEvent) => {
    debugger;  // 这里设置断点
    const data = JSON.parse(event.data);
}, []);
```

## 性能优化建议

1. **限制通知数量：** 最多显示5个通知
2. **防抖处理：** 相同消息1秒内只显示一次
3. **连接管理：** 页面隐藏时暂停，显示时恢复
4. **内存清理：** 定期清理过期连接

## 总结

### 核心问题

- SSE端点URL不匹配：`/api/notifications/stream` ❌ → `/notifications/subscribe` ✅

### 修复后的完整流程

```
用户操作（创建/更新任务）
    ↓
TaskService调用NotificationService
    ↓
NotificationService发送SSE事件
    ↓
前端EventSource接收（/notifications/subscribe）
    ↓
useEventSource hook处理
    ↓
useNotifications添加到通知列表
    ↓
NotificationToast显示Toast
    ↓
用户看到通知 🔔
```

### 验证方法

1. 检查Network中有`/notifications/subscribe`连接（pending状态）
2. 创建任务后立即看到toast
3. Console有SSE消息日志
4. Toast有正确的样式和图标

修复完成后，实时通知应该正常工作了！🎉
