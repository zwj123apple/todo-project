# 数据库面试宝典 💾

## 📚 MySQL + Redis + JPA

### Q1: MySQL索引原理

**答案**:

#### B+树索引结构

```
B+树特点：
1. 非叶子节点不存数据，只存索引
2. 叶子节点存储所有数据
3. 叶子节点之间有指针，便于范围查询
4. 高度低，查询快（3-4层可存千万数据）
```

#### 索引类型

```sql
-- 1. 主键索引（聚簇索引）
CREATE TABLE task (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255),
    user_id BIGINT,
    status VARCHAR(20),
    created_at DATETIME,
    INDEX idx_user_id (user_id),           -- 普通索引
    INDEX idx_status_created (status, created_at)  -- 复合索引
);

-- 2. 唯一索引
CREATE UNIQUE INDEX idx_username ON user(username);

-- 3. 全文索引
CREATE FULLTEXT INDEX idx_content ON task(description);
```

#### 索引失效场景

```sql
-- ❌ 索引失效
SELECT * FROM task WHERE YEAR(created_at) = 2024;  -- 函数

SELECT * FROM task WHERE title LIKE '%关键词%';    -- 前缀模糊

SELECT * FROM task WHERE status = 'TODO' OR user_id = 1;  -- OR

-- ✅ 索引生效
SELECT * FROM task WHERE created_at >= '2024-01-01';  -- 范围

SELECT * FROM task WHERE title LIKE '关键词%';  -- 后缀模糊

SELECT * FROM task WHERE status = 'TODO' AND user_id = 1;  -- AND
```

---

### Q2: 事务隔离级别

**答案**:

| 隔离级别         | 脏读 | 不可重复读 | 幻读 |
| ---------------- | ---- | ---------- | ---- |
| READ UNCOMMITTED | ✅   | ✅         | ✅   |
| READ COMMITTED   | ❌   | ✅         | ✅   |
| REPEATABLE READ  | ❌   | ❌         | ✅   |
| SERIALIZABLE     | ❌   | ❌         | ❌   |

#### MySQL默认：REPEATABLE READ

```java
@Service
public class TaskService {

    @Transactional(isolation = Isolation.REPEATABLE_READ)
    public void updateTask(Long id) {
        // 事务内多次读取，结果一致
        Task task1 = taskRepository.findById(id);
        // ... 其他操作
        Task task2 = taskRepository.findById(id);  // 与task1一致
    }

    @Transactional(rollbackFor = Exception.class)
    public void createTaskWithTags(TaskRequest request) {
        // 任何异常都回滚
        Task task = taskRepository.save(task);
        tagRepository.saveAll(tags);
        // 如果saveAll失败，task也会回滚
    }
}
```

---

### Q3: Redis缓存策略

**答案**:

#### 缓存模式

**1. Cache Aside（旁路缓存）- 最常用**

```java
@Service
public class TaskService {
    @Autowired
    private RedisTemplate<String, Task> redisTemplate;

    public Task getTask(Long id) {
        String key = "task:" + id;

        // 1. 先查缓存
        Task task = redisTemplate.opsForValue().get(key);
        if (task != null) {
            return task;
        }

        // 2. 缓存miss，查数据库
        task = taskRepository.findById(id).orElse(null);

        // 3. 写入缓存
        if (task != null) {
            redisTemplate.opsForValue().set(key, task, 10, TimeUnit.MINUTES);
        }

        return task;
    }

    public void updateTask(Long id, Task task) {
        // 1. 先更新数据库
        taskRepository.save(task);

        // 2. 删除缓存（而不是更新）
        redisTemplate.delete("task:" + id);
    }
}
```

**2. 缓存穿透解决方案**

```java
// 问题：查询不存在的数据，每次都打到数据库
// 解决：缓存空值
public Task getTask(Long id) {
    Task task = redisTemplate.opsForValue().get("task:" + id);

    if (task == null) {
        task = taskRepository.findById(id).orElse(null);

        // 即使为null也缓存，设置短过期时间
        redisTemplate.opsForValue().set("task:" + id,
            task != null ? task : new Task(),  // 空对象
            task != null ? 10 : 1,  // 空值1分钟过期
            TimeUnit.MINUTES);
    }

    return task.getId() != null ? task : null;
}
```

**3. 缓存雪崩解决方案**

```java
// 问题：
```
