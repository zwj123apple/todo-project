# 系统设计面试指南（精简版）

## 一、系统设计核心原则

### 1. CAP 定理

**三个特性，只能同时满足两个**：

- **C (Consistency)** - 一致性：所有节点同时看到相同数据
- **A (Availability)** - 可用性：系统持续提供服务
- **P (Partition Tolerance)** - 分区容错：网络分区时系统继续工作

**常见选择**：

- CP：银行系统、订单系统（优先一致性）
- AP：社交媒体、新闻推送（优先可用性）
- CA：单机系统（实际不存在，因为网络必然会分区）

### 2. BASE 理论

**替代 ACID 的分布式系统理论**：

- **BA (Basically Available)** - 基本可用
- **S (Soft state)** - 软状态
- **E (Eventually consistent)** - 最终一致性

### 3. 负载均衡算法

```
1. 轮询（Round Robin）
2. 加权轮询（Weighted Round Robin）
3. 最少连接（Least Connections）
4. IP Hash
5. 一致性哈希（Consistent Hashing）
```

## 二、缓存策略

### 1. 缓存模式

**Cache-Aside（旁路缓存）**

```java
// 读取
public User getUser(Long id) {
    User user = cache.get(id);
    if (user == null) {
        user = db.query(id);
        cache.set(id, user, TTL);
    }
    return user;
}

// 更新：先更新数据库，再删除缓存
public void updateUser(User user) {
    db.update(user);
    cache.delete(user.getId());
}
```

**Read-Through / Write-Through**

- 缓存层负责同步数据库
- 应用层只与缓存交互

**Write-Behind（异步写）**

- 先写缓存，异步批量写数据库
- 高性能但可能丢数据

### 2. 缓存问题及解决方案

**缓存穿透**（查询不存在的数据）

```java
// 解决方案1：缓存空值
if (user == null) {
    cache.set(id, NULL_VALUE, SHORT_TTL);
}

// 解决方案2：布隆过滤器
if (!bloomFilter.mightContain(id)) {
    return null;
}
```

**缓存击穿**（热点数据过期）

```java
// 解决方案：加锁或永不过期
public User getUser(Long id) {
    User user = cache.get(id);
    if (user == null) {
        synchronized(id.toString().intern()) {
            user = cache.get(id); // 双重检查
            if (user == null) {
                user = db.query(id);
                cache.set(id, user, TTL);
            }
        }
    }
    return user;
}
```

**缓存雪崩**（大量缓存同时失效）

```java
// 解决方案：随机TTL + 降级熔断
int ttl = BASE_TTL + random.nextInt(300); // 随机5分钟
cache.set(key, value, ttl);
```

## 三、消息队列

### 1. 使用场景

1. **异步处理**：注册后发送邮件
2. **削峰填谷**：秒杀系统
3. **系统解耦**：订单系统 → 多个下游系统
4. **分布式事务**：最终一致性

### 2. Kafka vs RabbitMQ

| 特性     | Kafka          | RabbitMQ  |
| -------- | -------------- | --------- |
| 吞吐量   | 百万级/秒      | 万级/秒   |
| 延迟     | ms级           | μs级      |
| 持久化   | 磁盘（顺序写） | 内存+磁盘 |
| 使用场景 | 日志、大数据   | 实时消息  |

### 3. 消息可靠性保证

**生产者端**

```java
// 开启确认机制
producer.send(record, (metadata, exception) -> {
    if (exception != null) {
        // 重试或记录
        log.error("发送失败", exception);
    }
});
```

**消费者端**

```java
// 手动提交offset
@KafkaListener(topics = "orders")
public void consume(ConsumerRecord<String, Order> record,
                    Acknowledgment ack) {
    try {
        processOrder(record.value());
        ack.acknowledge(); // 处理成功后提交
    } catch (Exception e) {
        // 重试或进入死信队列
    }
}
```

## 四、分布式锁

### 1. Redis 实现

```java
public class RedisLock {

    // 加锁
    public boolean tryLock(String key, String requestId, int expireTime) {
        String result = jedis.set(
            key,
            requestId,
            "NX",  // 不存在才设置
            "PX",  // 毫秒
            expireTime
        );
        return "OK".equals(result);
    }

    // 解锁（Lua脚本保证原子性）
    public boolean unlock(String key, String requestId) {
        String script =
            "if redis.call('get', KEYS[1]) == ARGV[1] then " +
            "    return redis.call('del', KEYS[1]) " +
            "else " +
            "    return 0 " +
            "end";
        Object result = jedis.eval(script,
            Collections.singletonList(key),
            Collections.singletonList(requestId));
        return Long.valueOf(1).equals(result);
    }
}
```

### 2. Redisson 分布式锁

```java
RLock lock = redisson.getLock("myLock");
try {
    // 尝试加锁，最多等待10秒，锁30秒后自动释放
    boolean isLocked = lock.tryLock(10, 30, TimeUnit.SECONDS);
    if (isLocked) {
        // 业务逻辑
    }
} finally {
    if (lock.isHeldByCurrentThread()) {
        lock.unlock();
    }
}
```

## 五、限流与熔断

### 1. 限流算法

**令牌桶算法（Token Bucket）**

```java
public class TokenBucket {
    private final long capacity; // 桶容量
    private final long rate;     // 生成速率
    private long tokens;
    private long lastTime;

    public synchronized boolean tryAcquire() {
        long now = System.currentTimeMillis();
        // 补充令牌
        tokens = Math.min(capacity,
            tokens + (now - lastTime) * rate / 1000);
        lastTime = now;

        if (tokens >= 1) {
            tokens--;
            return true;
        }
        return false;
    }
}
```

**滑动窗口算法**

```java
public class SlidingWindow {
    private final Queue<Long> window = new LinkedList<>();
    private final int limit;
    private final long windowSize;

    public synchronized boolean tryAcquire() {
        long now = System.currentTimeMillis();
        // 移除过期请求
        while (!window.isEmpty() &&
               now - window.peek() > windowSize) {
            window.poll();
        }

        if (window.size() < limit) {
            window.offer(now);
            return true;
        }
        return false;
    }
}
```

### 2. 熔断降级（Sentinel/Hystrix）

```java
@SentinelResource(
    value = "getUserInfo",
    blockHandler = "handleBlock",    // 限流/熔断处理
    fallback = "handleFallback"      // 异常降级
)
public User getUserInfo(Long id) {
    return userService.getUser(id);
}

// 限流处理
public User handleBlock(Long id, BlockException ex) {
    return User.builder()
        .id(id)
        .name("系统繁忙")
        .build();
}

// 降级处理
public User handleFallback(Long id, Throwable ex) {
    return getCachedUser(id); // 返回缓存数据
}
```

## 六、数据库扩展

### 1. 分库分表

**垂直拆分**

- 按业务模块拆分（用户库、订单库）
- 按访问频率拆分（热数据、冷数据）

**水平拆分**

```java
// 按用户ID分片
public int getShardIndex(Long userId) {
    return (int)(userId % SHARD_COUNT);
}

// 按时间分片（订单表）
public String getTableName(Date orderTime) {
    SimpleDateFormat sdf = new SimpleDateFormat("yyyyMM");
    return "orders_" + sdf.format(orderTime);
}
```

### 2. 读写分离

```java
@Configuration
public class DataSourceConfig {

    @Bean
    public DataSource routingDataSource(
            @Qualifier("masterDataSource") DataSource master,
            @Qualifier("slaveDataSource") DataSource slave) {

        Map<Object, Object> targetDataSources = new HashMap<>();
        targetDataSources.put("master", master);
        targetDataSources.put("slave", slave);

        RoutingDataSource routing = new RoutingDataSource();
        routing.setTargetDataSources(targetDataSources);
        routing.setDefaultTargetDataSource(master);
        return routing;
    }
}

// 根据注解选择数据源
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface ReadOnly {
}
```

## 七、常见系统设计题

### 1. 短链接系统设计

**核心功能**：

- 生成短链：长URL → 短URL
- 跳转：短URL → 长URL

**设计要点**：

```
1. ID生成：雪花算法 → Base62编码
2. 存储：Redis（热数据）+ MySQL（全量）
3. 防止重复：布隆过滤器
4. 高并发：CDN + 缓存
5. 统计：异步写入（Kafka + Flink）
```

**数据库设计**：

```sql
CREATE TABLE short_urls (
    id BIGINT PRIMARY KEY,
    short_code VARCHAR(10) UNIQUE,
    long_url VARCHAR(2048),
    user_id BIGINT,
    expire_at TIMESTAMP,
    created_at TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_code (short_code)
);
```

### 2. 秒杀系统设计

**核心挑战**：高并发、超卖

**解决方案**：

```
1. 前端限流：按钮防重、验证码
2. CDN缓存：静态资源
3. Redis预减库存：
   - DECR命令原子性
   - 预热库存到Redis
4. 消息队列削峰：
   - 请求进队列
   - 异步处理订单
5. 数据库层：
   - 乐观锁：UPDATE ... WHERE stock > 0
   - 分库分表
```

```java
@Service
public class SeckillService {

    // 预减库存
    public boolean preSeckill(Long productId, Long userId) {
        String key = "seckill:" + productId;
        Long stock = redis.decr(key);

        if (stock < 0) {
            redis.incr(key); // 回滚
            return false;
        }

        // 放入消息队列
        SeckillMessage msg = new SeckillMessage(productId, userId);
        kafkaProducer.send("seckill-orders", msg);
        return true;
    }

    // 异步创建订单
    @KafkaListener(topics = "seckill-orders")
    public void createOrder(SeckillMessage msg) {
        // 真实扣库存 + 创建订单
        orderService.createSeckillOrder(msg);
    }
}
```

### 3. 分布式ID生成

**雪花算法（Snowflake）**

```
64位Long型：
- 1位符号位
- 41位时间戳（毫秒）→ 69年
- 10位机器ID（1024台机器）
- 12位序列号（4096个ID/毫秒）
```

```java
public class SnowflakeIdGenerator {
    private final long workerId;
    private long sequence = 0L;
    private long lastTimestamp = -1L;

    public synchronized long nextId() {
        long timestamp = System.currentTimeMillis();

        // 同一毫秒内
        if (timestamp == lastTimestamp) {
            sequence = (sequence + 1) & 4095; // 12位
            if (sequence == 0) {
                // 序列号用完，等下一毫秒
                timestamp = tilNextMillis(lastTimestamp);
            }
        } else {
            sequence = 0L;
        }

        lastTimestamp = timestamp;

        return ((timestamp - EPOCH) << 22)
             | (workerId << 12)
             | sequence;
    }
}
```

## 八、面试答题套路

### 1. 系统设计四步法

**第一步：需求分析**

- 功能需求：核心功能有哪些？
- 非功能需求：QPS多少？数据量多大？

**第二步：核心设计**

- 画架构图（前端、后端、数据库、缓存）
- 确定技术选型

**第三步：深入细节**

- API设计
- 数据库设计
- 缓存策略
