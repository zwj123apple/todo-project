# 标签问题诊断指南

## 步骤1：检查后端服务是否重启

**重要：修改代码后必须重启后端服务！**

```bash
# 停止当前运行的后端服务（如果有）
# 然后重新启动

cd backend
mvn clean spring-boot:run
```

等待服务完全启动后再测试。

## 步骤2：测试后端API

### 2.1 注册新用户

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser2026",
    "email": "test2026@example.com",
    "password": "password123",
    "nickname": "测试用户2026"
  }'
```

保存返回的 `accessToken`。

### 2.2 获取标签列表

使用上面获取的 accessToken：

```bash
curl -X GET http://localhost:8080/api/tags \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

**预期结果：** 应该返回5个默认标签的JSON数据，格式如下：

```json
{
  "success": true,
  "message": "操作成功",
  "data": [
    {
      "id": 1,
      "name": "工作",
      "color": "#EF4444"
    },
    {
      "id": 2,
      "name": "个人",
      "color": "#3B82F6"
    },
    ...
  ]
}
```

如果返回空数组 `"data": []`，说明后端有问题。

## 步骤3：检查数据库

```sql
-- 查看用户是否存在
SELECT * FROM users WHERE username = 'testuser2026';

-- 查看该用户的标签（替换 USER_ID 为实际的用户ID）
SELECT * FROM tags WHERE user_id = USER_ID;
```

## 步骤4：检查后端日志

启动后端服务时，查看控制台是否有错误信息，特别是：

- 数据库连接错误
- SQL异常
- 事务回滚
- 权限错误

## 步骤5：前端测试

### 5.1 清除浏览器缓存

1. 打开浏览器开发者工具（F12）
2. 右键点击刷新按钮，选择"清空缓存并硬性重新加载"
3. 或者使用无痕模式重新测试

### 5.2 检查Network请求

1. 打开开发者工具的Network标签
2. 注册并登录新用户
3. 打开创建任务页面
4. 查看是否有对 `/api/tags` 的请求
5. 检查请求的响应内容

**正常响应应该包含5个标签的数据。**

### 5.3 检查Console错误

查看浏览器Console是否有任何JavaScript错误。

## 常见问题和解决方案

### 问题1：后端返回空数组

**原因：** TagService 的修改没有生效

**解决：**

```bash
# 完全重新编译并启动
cd backend
mvn clean compile
mvn spring-boot:run
```

### 问题2：数据库中没有标签记录

**原因：** 标签创建失败但没有报错

**解决：** 检查数据库约束和权限

```sql
-- 检查tags表的结构
DESCRIBE tags;

-- 检查是否有唯一约束冲突
SELECT user_id, name, COUNT(*)
FROM tags
GROUP BY user_id, name
HAVING COUNT(*) > 1;
```

### 问题3：前端显示空数组但后端返回了数据

**原因：** 前端解析或渲染问题

**解决：**

1. 清除React Query缓存
2. 检查TypeScript类型定义
3. 在CreateTaskModal中添加调试日志：

```typescript
const { tags = [] } = useTags();
console.log("Tags received:", tags); // 添加这行调试
```

### 问题4：AuthService创建标签时抛出异常

**原因：** 数据库事务问题或约束冲突

**检查后端日志** 是否有类似错误：

- `ConstraintViolationException`
- `DataIntegrityViolationException`
- `TransactionRollbackException`

## 快速验证脚本

创建一个测试文件 `test-tags.sh`:

```bash
#!/bin/bash

echo "=== 测试标签功能 ==="
echo ""

# 1. 注册用户
echo "1. 注册新用户..."
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "tagtest_'$(date +%s)'",
    "email": "tagtest_'$(date +%s)'@example.com",
    "password": "password123",
    "nickname": "标签测试"
  }')

echo "注册响应: $REGISTER_RESPONSE"
echo ""

# 2. 提取token
TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ 注册失败，无法获取token"
    exit 1
fi

echo "✓ 注册成功，获取到token"
echo ""

# 3. 获取标签
echo "2. 获取标签列表..."
TAGS_RESPONSE=$(curl -s -X GET http://localhost:8080/api/tags \
  -H "Authorization: Bearer $TOKEN")

echo "标签响应: $TAGS_RESPONSE"
echo ""

# 4. 检查标签数量
TAG_COUNT=$(echo $TAGS_RESPONSE | grep -o '"name"' | wc -l)

if [ "$TAG_COUNT" -eq 5 ]; then
    echo "✅ 成功！用户有 $TAG_COUNT 个默认标签"
else
    echo "❌ 失败！用户只有 $TAG_COUNT 个标签（应该有5个）"
fi
```

运行测试：

```bash
chmod +x test-tags.sh
./test-tags.sh
```

## 总结

按照以下顺序排查：

1. ✅ 确认后端服务已重启
2. ✅ 测试后端API是否返回标签
3. ✅ 检查数据库是否有标签记录
4. ✅ 清除前端缓存重新测试
5. ✅ 查看浏览器Network和Console

如果以上都正常，问题就解决了！
