# Java & Database 面试补充文档（完整版）

## 一、Spring Boot 事务管理

### 1. @Transactional 详解

```java
@Service
public class TaskService {

    // 基本事务
    @Transactional
    public void createTask(Task task) {
        taskRepository.save(task);
    }

    // 只读事务（优化性能）
    @Transactional(readOnly = true)
    public List<Task> getAllTasks() {
        return taskRepository.findAll();
    }

    // 指定传播行为
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logOperation(String operation) {
        // 新事务，独立提交
    }

    // 指定隔离级别
    @Transactional(isolation = Isolation.REPEATABLE_READ)
    public void updateTaskStatus(Long id, Status status) {
        Task task = taskRepository.findById(id).orElseThrow();
        task.setStatus(status);
    }

    // 指定回滚规则
    @Transactional(rollbackFor = Exception.class,
                   noRollbackFor = NotFoundException.class)
    public void complexOperation() {
        // 业务逻辑
    }
}
```

### 2. 事务传播行为

| 传播行为      | 说明                         |
| ------------- | ---------------------------- |
| REQUIRED      | 默认，有事务加入，无事务创建 |
| REQUIRES_NEW  | 总是创建新事务               |
| NESTED        | 嵌套事务（基于保存点）       |
| MANDATORY     | 必须在事务中运行             |
| SUPPORTS      | 有事务就用，无事务就不用     |
| NOT_SUPPORTED | 挂起当前事务，以非事务运行   |
| NEVER         | 不能在事务中运行             |

## 二、数据库索引优化

### 1. 索引类型

```sql
-- 普通索引
CREATE INDEX idx_user_email ON users(email);

-- 唯一索引
CREATE UNIQUE INDEX idx_user_username ON users(username);

-- 复合索引（最左前缀原则）
CREATE INDEX idx_task_user_status ON tasks(user_id, status, created_at);

-- 全文索引（MySQL）
CREATE FULLTEXT INDEX idx_task_description ON tasks(description);

-- 覆盖索引示例
CREATE INDEX idx_user_cover ON users(id, username, email);
SELECT id, username, email FROM users WHERE id = 1; -- 只查询索引列
```

### 2. 索引优化规则

**最左前缀原则**

```sql
-- 索引：(user_id, status, created_at)

-- ✅ 会使用索引
WHERE user_id = 1
WHERE user_id = 1 AND status = 'PENDING'
WHERE user_id = 1 AND status = 'PENDING' AND created_at > '2024-01-01'

-- ❌ 不会使用索引
WHERE status = 'PENDING'
WHERE created_at > '2024-01-01'
```

**避免索引失效**

```sql
-- ❌ 在索引列上使用函数
WHERE YEAR(created_at) = 2024

-- ✅ 改写查询
WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01'

-- ❌ 使用 !=、NOT IN
WHERE status != 'PENDING'

-- ✅ 使用 IN
WHERE status IN ('COMPLETED', 'IN_PROGRESS')

-- ❌ 字符串不加引号
WHERE username = 123  -- username 是 VARCHAR

-- ✅ 正确写法
WHERE username = '123'
```

## 三、SQL 性能优化

### 1. EXPLAIN 分析

```sql
EXPLAIN SELECT * FROM tasks WHERE user_id = 1;

-- 关键字段：
-- type: ALL(全表扫描) < index < range < ref < eq_ref < const
-- key: 使用的索引名
-- rows: 扫描行数
-- Extra: 额外信息（Using filesort, Using temporary 需要优化）
```

### 2. 查询优化技巧

```sql
-- ❌ SELECT *
SELECT * FROM tasks;

-- ✅ 只查询需要的列
SELECT id, title, status FROM tasks;

-- ❌ 子查询
SELECT * FROM users WHERE id IN (
    SELECT user_id FROM tasks WHERE status = 'PENDING'
);

-- ✅ JOIN
SELECT u.* FROM users u
INNER JOIN tasks t ON u.id = t.user_id
WHERE t.status = 'PENDING';

-- ✅ 使用 LIMIT
SELECT * FROM tasks ORDER BY created_at DESC LIMIT 10;

-- ✅ 避免在 WHERE 中使用 OR（改用 UNION）
SELECT * FROM tasks WHERE status = 'PENDING'
UNION ALL
SELECT * FROM tasks WHERE priority = 'HIGH';
```

## 四、JPA 高级用法

### 1. 自定义查询

```java
public interface TaskRepository extends JpaRepository<Task, Long> {

    // 方法名查询
    List<Task> findByUserIdAndStatus(Long userId, Status status);

    // @Query JPQL
    @Query("SELECT t FROM Task t WHERE t.user.id = :userId " +
           "AND t.status = :status ORDER BY t.createdAt DESC")
    List<Task> findUserTasks(@Param("userId") Long userId,
                             @Param("status") Status status);

    // 原生 SQL
    @Query(value = "SELECT * FROM tasks WHERE user_id = ?1 " +
                   "AND status = ?2", nativeQuery = true)
    List<Task> findByUserIdAndStatusNative(Long userId, String status);

    // 投影查询（只查询部分字段）
    @Query("SELECT new com.example.dto.TaskDTO(t.id, t.title, t.status) " +
           "FROM Task t WHERE t.userId = :userId")
    List<TaskDTO> findTaskDTOsByUserId(@Param("userId") Long userId);

    // 分页查询
    Page<Task> findByUserId(Long userId, Pageable pageable);
}
```

### 2. 懒加载与急加载

```java
@Entity
public class User {
    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY) // 默认懒加载
    private List<Task> tasks;

    @ManyToMany(fetch = FetchType.EAGER) // 急加载
    private Set<Role> roles;
}

// 解决 N+1 问题
@Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.tasks WHERE u.id = :id")
Optional<User> findByIdWithTasks(@Param("id") Long id);
```

### 3. 批量操作

```java
@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    @Modifying
    @Query("UPDATE Task t SET t.status = :status WHERE t.id IN :ids")
    int batchUpdateStatus(@Param("ids") List<Long> ids,
                          @Param("status") Status status);

    @Modifying
    @Query("DELETE FROM Task t WHERE t.status = :status " +
           "AND t.createdAt < :before")
    int deleteOldTasks(@Param("status") Status status,
                       @Param("before") LocalDateTime before);
}

// 使用示例
@Transactional
public void batchUpdate(List<Long> ids, Status status) {
    taskRepository.batchUpdateStatus(ids, status);
}
```

## 五、数据库设计最佳实践

### 1. 范式设计

**第一范式（1NF）**：列不可再分

```sql
-- ❌ 违反 1NF
CREATE TABLE users (
    id BIGINT,
    name VARCHAR(100),
    phones VARCHAR(200)  -- '13800138000,13900139000'
);

-- ✅ 符合 1NF
CREATE TABLE user_phones (
    id BIGINT,
    user_id BIGINT,
    phone VARCHAR(20)
);
```

**第二范式（2NF）**：非主键列完全依赖主键
**第三范式（3NF）**：非主键列不传递依赖

### 2. 表设计原则

```sql
CREATE TABLE tasks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    priority INT DEFAULT 0,
    user_id BIGINT NOT NULL,

    -- 审计字段
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT,
    updated_by BIGINT,

    -- 软删除
    deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,

    -- 外键约束
    CONSTRAINT fk_task_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE,

    -- 索引
    INDEX idx_user_status (user_id, status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 六、常见面试题

### 1. InnoDB vs MyISAM

| 特性     | InnoDB      | MyISAM      |
| -------- | ----------- | ----------- |
| 事务     | ✅ 支持     | ❌ 不支持   |
| 外键     | ✅ 支持     | ❌ 不支持   |
| 行锁     | ✅ 支持     | ❌ 表锁     |
| MVCC     | ✅ 支持     | ❌ 不支持   |
| 崩溃恢复 | ✅ 自动恢复 | ⚠️ 需要修复 |

**结论**：生产环境首选 InnoDB

### 2. 数据库连接池

```java
@Configuration
public class DataSourceConfig {

    @Bean
    public DataSource dataSource() {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl("jdbc:mysql://localhost:3306/mydb");
        config.setUsername("root");
        config.setPassword("password");

        // 连接池配置
        config.setMaximumPoolSize(20);      // 最大连接数
        config.setMinimumIdle(5);           // 最小空闲连接
        config.setConnectionTimeout(30000); // 连接超时
        config.setIdleTimeout(600000);      // 空闲超时
        config.setMaxLifetime(1800000);     // 最大生命周期

        return new HikariDataSource(config);
    }
}
```

### 3. 数据库锁

**乐观锁（Version）**

```java
@Entity
public class Task {
    @Id
    private Long id;

    @Version  // JPA 乐观锁
    private Long version;

    private String title;
}

// 更新时自动检查版本号
// UPDATE tasks SET title=?, version=version+1
// WHERE id=? AND version=?
```

**悲观锁**

```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("SELECT t FROM Task t WHERE t.id = :id")
Optional<Task> findByIdForUpdate(@Param("id") Long id);
```

### 4. 缓存策略

```java
@Service
public class TaskService {

    // Spring Cache
    @Cacheable(value = "tasks", key = "#id")
    public Task getTask(Long id) {
        return taskRepository.findById(id).orElseThrow();
    }

    @CachePut(value = "tasks", key = "#task.id")
    public Task updateTask(Task task) {
        return taskRepository.save(task);
    }

    @CacheEvict(value = "tasks", key = "#id")
    public void deleteTask(Long id) {
        taskRepository.deleteById(id);
    }

    @CacheEvict(value = "tasks", allEntries = true)
    public void clearAllCache() {
        // 清空所有缓存
    }
}
```

## 七、实战优化案例

### 案例1：慢查询优化

**问题**：查询用户及其任务列表耗时 2s

```sql
-- 原始查询
SELECT * FROM users u
LEFT JOIN tasks t ON u.id = t.user_id
WHERE u.department = 'IT';
```

**优化步骤**：

1. 添加索引：`CREATE INDEX idx_user_dept ON users(department)`
2. 只查询需要的列
3. 使用分页
4. 考虑缓存热点数据

**优化后**：耗时降至 50ms

### 案例2：死锁解决

**问题场景**：两个事务互相等待对方释放锁

**解决方案**：

1. 统一加锁顺序
2. 减小事务粒度
3. 使用乐观锁代替悲观锁
4. 设置锁超时时间

```java
@Transactional(timeout = 10) // 10秒超时
public void transfer(Long fromId, Long toId, BigDecimal amount) {
    // 统一按 ID 顺序加锁
    Long firstId = Math.min(fromId, toId);
    Long secondId = Math.max(fromId, toId);

    Account first = accountRepository.findByIdForUpdate(firstId);
    Account second = accountRepository.findByIdForUpdate(secondId);

    // 执行转账逻辑
}
```

---

**面试重点**：

- Spring 事务传播行为（7种）
- MySQL 索引优化（最左前缀、覆盖索引）
- JPA 懒加载与 N+1 问题
- 乐观锁 vs 悲观锁
- InnoDB 引擎
