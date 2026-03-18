# Java & Database 补充知识点 📝

> 本文档补充 JAVA_SPRINGBOOT_INTERVIEW.md 和 DATABASE_INTERVIEW.md 中被截断的内容

## ☕ Java Spring Boot 补充

### AOP编程详解

**切面示例 - 日志记录**

```java
@Aspect
@Component
@Slf4j
public class LoggingAspect {

    // 前置通知
    @Before("execution(* com.example.backend.controller.*.*(..))")
    public void logBefore(JoinPoint joinPoint) {
        log.info("调用方法: {}", joinPoint.getSignature().getName());
    }

    // 后置通知
    @After("execution(* com.example.backend.controller.*.*(..))")
    public void logAfter(JoinPoint joinPoint) {
        log.info("方法执行完成: {}", joinPoint.getSignature().getName());
    }

    // 环绕通知（最常用）
    @Around("@annotation(org.springframework.web.bind.annotation.PostMapping)")
    public Object logExecutionTime(ProceedingJoinPoint joinPoint) throws Throwable {
        long start = System.currentTimeMillis();
        Object result = joinPoint.proceed();
        long duration = System.currentTimeMillis() - start;
        log.info("{} 执行耗时: {}ms", joinPoint.getSignature(), duration);
        return result;
    }
}
```

---

### 事务管理详解

**@Transactional注解**

```java
@Service
public class TaskService {

    // 默认配置
    @Transactional
    public void createTask(Task task) {
        taskRepository.save(task);
    }

    // 完整配置
    @Transactional(
        isolation = Isolation.REPEATABLE_READ,  // 隔离级别
        propagation = Propagation.REQUIRED,     // 传播行为
        rollbackFor = Exception.class,          // 回滚异常
        timeout = 30                            // 超时时间
    )
    public void complexOperation() {
        // 复杂业务逻辑
    }
}
```

**传播行为**

| 传播行为      | 说明                           |
| ------------- | ------------------------------ |
| REQUIRED      | 有事务就用，没有就创建（默认） |
| REQUIRES_NEW  | 总是创建新事务                 |
| SUPPORTS      | 有事务就用，没有就非事务执行   |
| NOT_SUPPORTED | 总是非事务执行                 |
| NEVER         | 不能在事务中执行               |

---

## 💾 Database 补充

### Redis缓存雪崩解决方案

```java
// 问题：大量缓存同时过期，数据库压力骤增
// 解决：设置随机过期时间

public void cacheWithRandomExpire(String key, Object value) {
    // 基础过期时间10分钟
    int baseExpire = 10;
    // 随机增加0-2分钟
    int randomExpire = ThreadLocalRandom.current().nextInt(3);

    redisTemplate.opsForValue().set(
        key,
        value,
        baseExpire + randomExpire,
        TimeUnit.MINUTES
    );
}
```

---

### JPA常用注解

```java
@Entity
@Table(name = "task")
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String title;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToMany
    @JoinTable(
        name = "task_tag",
        joinColumns = @JoinColumn(name = "task_id"),
        inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    private List<Tag> tags;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
```

---

### N+1查询问题

```java
// ❌ N+1问题
List<Task> tasks = taskRepository.findAll();  // 1次查询
for (Task task : tasks) {
    task.getTags
```
