# Kafka 学习指南 - 轻松过面试

## 📚 目录

1. [快速启动](#快速启动)
2. [核心概念](#核心概念)
3. [代码示例](#代码示例)
4. [面试重点](#面试重点)
5. [常见问题](#常见问题)
6. [实战演练](#实战演练)

---

## 🚀 快速启动

### 步骤1: 启动Kafka环境

```bash
# 启动所有服务（包括Zookeeper, Kafka, Kafka UI）
docker-compose up -d zookeeper kafka kafka-ui

# 查看服务状态
docker-compose ps

# 查看Kafka日志
docker logs -f todopro-kafka
```

### 步骤2: 访问Kafka UI

打开浏览器访问: **http://localhost:8081**

这是一个可视化界面，可以查看:

- Topics（主题）
- Messages（消息）
- Consumers（消费者）
- Brokers（代理）

### 步骤3: 启动后端服务

```bash
# 进入backend目录
cd backend

# 启动Spring Boot应用
mvn spring-boot:run
```

### 步骤4: 测试Kafka功能

打开Postman或浏览器，访问以下端点：

```bash
# 测试发送任务创建事件
POST http://localhost:8080/api/kafka/test/task-created?taskId=1&title=我的第一个Kafka消息

# 测试发送任务更新事件
POST http://localhost:8080/api/kafka/test/task-updated?taskId=1&status=IN_PROGRESS

# 测试发送通知
POST http://localhost:8080/api/kafka/test/notification?userId=1&title=测试通知

# 批量发送测试
POST http://localhost:8080/api/kafka/test/batch-send?count=20

# 健康检查
GET http://localhost:8080/api/kafka/test/health
```

---

## 🎯 核心概念（面试必会）

### 1. Topic（主题）

**是什么？**

- 类似于数据库的表，消息的分类单位
- 生产者发送消息到Topic，消费者从Topic读取消息

**面试要点：**

```java
// 创建Topic的三个关键参数
@Bean
public NewTopic myTopic() {
    return TopicBuilder.name("my-topic")
            .partitions(3)    // 分区数：影响并行度和性能
            .replicas(1)      // 副本数：影响可靠性和容错
            .build();
}
```

### 2. Partition（分区）

**是什么？**

- Topic的物理分割，实现并行处理
- 每个分区是有序的消息队列
- 同一个Key的消息会发送到同一个分区

**面试要点：**

- 分区数决定了消费者的最大并行度
- 分区内有序，分区间无序
- 通过Key进行分区路由

```java
// 发送消息时指定Key，相同Key会进入同一分区
kafkaTemplate.send(topic, key, message);
```

### 3. Producer（生产者）

**核心配置：**

```yaml
spring:
  kafka:
    producer:
      acks: all # 消息确认级别
      retries: 3 # 重试次数
      batch-size: 16384 # 批量大小
```

**acks参数（面试高频）：**

- `acks=0`: 不等待确认（最快，可能丢失）
- `acks=1`: Leader确认（中等）
- `acks=all`: 所有副本确认（最可靠，最慢）

### 4. Consumer（消费者）

**核心配置：**

```yaml
spring:
  kafka:
    consumer:
      group-id: my-group # 消费者组
      auto-offset-reset: earliest # 偏移量策略
      enable-auto-commit: true # 自动提交
```

**消费者组（面试必问）：**

- 同组内的消费者负载均衡消费
- 不同组的消费者独立消费所有消息
- 一个分区只能被组内一个消费者消费

### 5. Offset（偏移量）

**是什么？**

- 消息在分区中的位置标识
- 消费者通过offset记录消费进度

**面试要点：**

- `earliest`: 从最早的消息开始
- `latest`: 从最新的消息开始
- `none`: 如果没有offset则抛异常

---

## 💻 代码示例

### 示例1: 发送消息（生产者）

```java
@Service
@RequiredArgsConstructor
public class MyProducer {
    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void sendMessage(String topic, String key, Object message) {
        // 异步发送
        kafkaTemplate.send(topic, key, message)
            .whenComplete((result, ex) -> {
                if (ex == null) {
                    System.out.println("发送成功: " + result.getRecordMetadata().offset());
                } else {
                    System.out.println("发送失败: " + ex.getMessage());
                }
            });
    }
}
```

### 示例2: 接收消息（消费者）

```java
@Service
public class MyConsumer {

    @KafkaListener(
        topics = "my-topic",
        groupId = "my-group"
    )
    public void listen(String message) {
        System.out.println("收到消息: " + message);
        // 处理业务逻辑
    }
}
```

### 示例3: 获取消息元数据

```java
@KafkaListener(topics = "my-topic", groupId = "my-group")
public void listenWithMetadata(
        @Payload String message,
        @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
        @Header(KafkaHeaders.OFFSET) long offset,
        @Header(KafkaHeaders.RECEIVED_TIMESTAMP) long timestamp) {

    System.out.println("消息: " + message);
    System.out.println("分区: " + partition);
    System.out.println("偏移量: " + offset);
    System.out.println("时间戳: " + timestamp);
}
```

---

## 🎤 面试重点问题

### Q1: Kafka如何保证消息不丢失？

**答案：**

1. **生产者侧：**
   - 设置 `acks=all`，确保所有副本都写入
   - 配置重试机制 `retries>0`
   - 使用同步发送或处理异步回调

2. **Broker侧：**
   - 设置副本数 `replicas>1`
   - 配置最小同步副本 `min.insync.replicas=2`

3. **消费者侧：**
   - 手动提交offset
   - 业务处理成功后再提交

**代码示例：**

```java
// 手动提交offset
@KafkaListener(topics = "my-topic", groupId = "my-group")
public void listen(String message, Acknowledgment ack) {
    try {
        // 处理业务逻辑
        processMessage(message);
        // 手动提交
        ack.acknowledge();
    } catch (Exception e) {
        // 不提交，下次重新消费
        log.error("处理失败", e);
    }
}
```

### Q2: Kafka如何保证消息顺序？

**答案：**

1. **单分区内保证顺序**
   - 同一个分区内的消息是有序的
   - 使用相同的Key发送到同一分区

2. **全局顺序（不推荐）**
   - 设置1个分区（性能差）

3. **推荐方案**
   - 按业务Key分区（如userId）
   - 同一用户的消息有序即可

**代码示例：**

```java
// 使用userId作为Key，保证同一用户消息有序
String key = String.valueOf(userId);
kafkaTemplate.send(topic, key, message);
```

### Q3: Kafka和RabbitMQ的区别？

**答案对比表：**

| 特性           | Kafka                    | RabbitMQ         |
| -------------- | ------------------------ | ---------------- |
| **类型**       | 分布式流平台             | 消息队列         |
| **性能**       | 高吞吐（百万级/秒）      | 中等（万级/秒）  |
| **消息持久化** | 默认持久化到磁盘         | 可选持久化       |
| **消息顺序**   | 分区内有序               | 队列内有序       |
| **消息回溯**   | 支持（基于offset）       | 不支持           |
| **使用场景**   | 日志收集、流处理、大数据 | 解耦、异步、削峰 |

**面试加分回答：**

- Kafka适合大数据量、高吞吐的场景
- RabbitMQ适合复杂路由、低延迟的场景
- 实际项目中可以组合使用

### Q4: 如何处理消费失败的消息？

**答案：**

1. **重试机制**

```java
@RetryableTopic(
    attempts = "3",
    backoff = @Backoff(delay = 1000)
)
@KafkaListener(topics = "my-topic")
public void listen(String message) {
    // 自动重试3次
    processMessage(message);
}
```

2. **死信队列（DLT）**

```java
// 重试失败后发送到死信队列
@DltHandler
public void handleDlt(String message) {
    log.error("消息进入死信队列: {}", message);
    // 记录到数据库或告警
}
```

3. **手动补偿**
   - 记录失败消息到数据库
   - 定时任务重试
   - 人工介入处理

### Q5: Kafka的高可用如何实现？

**答案：**

1. **副本机制**
   - Leader副本：处理读写
   - Follower副本：同步数据
   - Leader故障时，Follower自动选举

2. **ISR（In-Sync Replicas）**
   - 保持同步的副本集合
   - 只有ISR中的副本才能被选为Leader

3. **Controller**
   - 集群中的Leader Broker
   - 负责分区Leader选举
   - 管理集群元数据

---

## 🔍 常见问题排查

### 问题1: 消费者不消费消息

**可能原因：**

1. 消费者组ID冲突
2. offset已经在最新位置
3. 反序列化失败

**解决方案：**

```bash
# 查看消费者组状态
docker exec -it todopro-kafka kafka-consumer-groups \
    --bootstrap-server localhost:9092 \
    --describe --group my-group

# 重置offset到最早
docker exec -it todopro-kafka kafka-consumer-groups \
    --bootstrap-server localhost:9092 \
    --group my-group \
    --reset-offsets --to-earliest \
    --topic my-topic --execute
```

### 问题2: 消息重复消费

**原因：**

- 消费者处理完消息后，提交offset前宕机
- 网络问题导致重复消费

**解决方案：**

1. **幂等性处理** - 确保重复消费不影响结果
2. **消息去重** - 使用Redis或数据库记录已处理消息ID
3. **手动提交offset** - 处理完再提交

```java
@KafkaListener(topics = "my-topic")
public void listen(String message, Acknowledgment ack) {
    String messageId = extractMessageId(message);

    // 检查是否已处理
    if (redisTemplate.hasKey(messageId)) {
        ack.acknowledge();
        return;
    }

    // 处理消息
    processMessage(message);

    // 记录已处理
    redisTemplate.opsForValue().set(messageId, "1", 24, TimeUnit.HOURS);

    // 提交offset
    ack.acknowledge();
}
```

---

## 🎯 实战演练

### 演练1: 发送你的第一条消息

```bash
# 1. 启动Kafka
docker-compose up -d zookeeper kafka

# 2. 发送消息
curl -X POST "http://localhost:8080/api/kafka/test/task-created?taskId=1&title=我的测试任务"

# 3. 查看日志（应该能看到消费者接收消息）
docker logs -f todopro-backend

# 4. 访问Kafka UI查看消息
# http://localhost:8081
```

### 演练2: 观察分区负载均衡

```bash
# 批量发送20条消息
curl -X POST "http://localhost:8080/api/kafka/test/batch-send?count=20"

# 在Kafka UI中观察：
# - 消息如何分布在3个分区中
# - 每个分区的offset变化
```

### 演练3: 模拟消费失败

修改消费者代码，故意抛出异常，观察重试机制。

---

## 📖 推荐学习资源

1. **官方文档**: https://kafka.apache.org/documentation/
2. **Kafka权威指南** (书籍)
3. **Spring Kafka文档**: https://spring.io/projects/spring-kafka

---

## ✅ 面试前自检清单

- [ ] 能解释Kafka的核心概念（Topic, Partition, Offset）
- [ ] 了解生产者和消费者的配置参数
- [ ] 能说出Kafka如何保证消息不丢失
- [ ] 了解消息顺序性保证方案
- [ ] 能对比Kafka和RabbitMQ的区别
- [ ] 了解消费失败的处理方案
- [ ] 能解释Kafka的高可用机制
- [ ] 实际运行过本项目的Kafka示例

---

## 🎉 总结

恭喜！现在你已经掌握了Kafka的核心知识：

1. ✅ **环境搭建** - Docker一键启动Kafka
2. ✅ **核心概念** - Topic, Partition, Offset等
3. ✅ **代码实践** - 生产者和消费者的完整实现
4. ✅ **面试准备** - 高频问题和标准答案
5. ✅ **问题排查** - 常见问题的解决方案

**下一步建议：**

1. 多次运行测试接口，观察消息流转
2. 修改配置参数，观察行为变化
3. 阅读生产者和消费者的源码
4. 准备自己的项目经验说明

**Good Luck! 🚀**
