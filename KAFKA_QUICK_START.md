# Kafka 快速启动指南

## 🎯 5分钟快速上手

### Step 1: 启动Kafka服务 (2分钟)

```bash
# 在项目根目录执行
docker-compose up -d zookeeper kafka kafka-ui

# 等待服务启动完成，查看状态
docker-compose ps

# 应该看到3个服务都是 Up 状态
```

### Step 2: 启动后端应用 (1分钟)

```bash
cd backend
mvn spring-boot:run
```

或者如果已经编译过：

```bash
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

### Step 3: 测试Kafka功能 (2分钟)

打开浏览器或Postman，测试以下接口：

#### 3.1 发送第一条消息

```bash
POST http://localhost:8080/api/kafka/test/task-created?taskId=1&title=我的第一个Kafka消息
```

**预期结果：**

```json
{
  "success": true,
  "message": "任务创建事件已发送到Kafka",
  "data": "查看后端日志可以看到消费者接收到的消息"
}
```

#### 3.2 查看消费者日志

```bash
# 查看后端日志，应该能看到类似输出：
====== 消费任务创建事件 ======
Partition: 0, Offset: 0
Message: TaskEventMessage(taskId=1, title=我的第一个Kafka消息, ...)
============================
```

#### 3.3 访问Kafka UI

打开浏览器访问: **http://localhost:8081**

可以看到：

- **Topics**: task-created-topic, task-updated-topic, user-notification-topic
- **Messages**: 刚才发送的消息
- **Consumers**: 消费者组信息

### Step 4: 更多测试

```bash
# 发送任务更新事件
POST http://localhost:8080/api/kafka/test/task-updated?taskId=1&status=DONE

# 发送用户通知
POST http://localhost:8080/api/kafka/test/notification?userId=1&title=测试通知

# 批量发送20条消息（观察分区分布）
POST http://localhost:8080/api/kafka/test/batch-send?count=20
```

---

## 📁 项目结构

```
backend/src/main/java/com/example/backend/
├── config/
│   └── KafkaConfig.java              # Kafka配置（Producer, Consumer, Topics）
├── kafka/
│   ├── dto/
│   │   ├── TaskEventMessage.java     # 任务事件消息DTO
│   │   └── NotificationMessage.java  # 通知消息DTO
│   ├── producer/
│   │   └── KafkaProducerService.java # 生产者服务
│   ├── consumer/
│   │   └── KafkaConsumerService.java # 消费者服务
│   └── controller/
│       └── KafkaTestController.java  # 测试接口
└── test/
    └── kafka/
        └── KafkaIntegrationTest.java # 集成测试
```

---

## 🎓 核心代码说明

### 1. Kafka配置 (KafkaConfig.java)

```java
// 创建3个Topic，每个3个分区，1个副本
@Bean
public NewTopic taskCreatedTopic() {
    return TopicBuilder.name("task-created-topic")
            .partitions(3)
            .replicas(1)
            .build();
}
```

### 2. 发送消息 (KafkaProducerService.java)

```java
// 异步发送消息
public void sendTaskCreatedEvent(TaskEventMessage message) {
    kafkaTemplate.send("task-created-topic", String.valueOf(message.getTaskId()), message)
        .whenComplete((result, ex) -> {
            if (ex == null) {
                log.info("消息发送成功");
            } else {
                log.error("消息发送失败", ex);
            }
        });
}
```

### 3. 接收消息 (KafkaConsumerService.java)

```java
// 监听Topic，自动消费消息
@KafkaListener(
    topics = "task-created-topic",
    groupId = "task-consumer-group"
)
public void listenTaskCreated(@Payload TaskEventMessage message) {
    log.info("收到消息: {}", message);
    // 处理业务逻辑
}
```

---

## 🔍 查看Kafka状态

### 命令行工具

```bash
# 列出所有Topic
docker exec -it todopro-kafka kafka-topics --bootstrap-server localhost:9092 --list

# 查看Topic详情
docker exec -it todopro-kafka kafka-topics --bootstrap-server localhost:9092 --describe --topic task-created-topic

# 查看消费者组
docker exec -it todopro-kafka kafka-consumer-groups --bootstrap-server localhost:9092 --list

# 查看消费者组详情
docker exec -it todopro-kafka kafka-consumer-groups --bootstrap-server localhost:9092 --describe --group task-consumer-group
```

### Kafka UI (推荐)

访问 http://localhost:8081，可视化查看：

- **Topics** - 所有主题和分区信息
- **Consumers** - 消费者组和消费进度
- **Messages** - 实时查看消息内容
- **Brokers** - Kafka节点状态

---

## ❓ 常见问题

### Q1: 消费者收不到消息？

**检查步骤：**

1. 确认Kafka服务启动：`docker-compose ps`
2. 查看后端日志是否有错误
3. 访问Kafka UI检查Topic是否存在
4. 检查消费者组offset位置

### Q2: 如何停止服务？

```bash
# 停止后端
Ctrl + C

# 停止Kafka服务
docker-compose down

# 停止并删除数据
docker-compose down -v
```

### Q3: 如何重新消费所有消息？

```bash
# 重置消费者组offset到最早
docker exec -it todopro-kafka kafka-consumer-groups \
    --bootstrap-server localhost:9092 \
    --group task-consumer-group \
    --reset-offsets --to-earliest \
    --topic task-created-topic --execute

# 然后重启后端服务
```

---

## 📚 进一步学习

1. **详细教程**: 查看 `KAFKA_LEARNING_GUIDE.md`
2. **面试准备**: 重点阅读"面试重点问题"部分
3. **实践练习**: 修改代码，尝试不同配置

---

## ✅ 快速自检

完成以下步骤，确保你掌握了基本用法：

- [ ] 成功启动Kafka服务
- [ ] 成功发送消息
- [ ] 在日志中看到消费者接收消息
- [ ] 访问Kafka UI查看消息
- [ ] 尝试批量发送消息
- [ ] 观察消息在不同分区的分布

**全部完成？恭喜！你已经掌握了Kafka的基本用法！🎉**

---

## 🚀 下一步

1. 阅读 `KAFKA_LEARNING_GUIDE.md` 学习核心概念
2. 查看代码注释，理解实现细节
3. 尝试修改配置，观察行为变化
4. 准备面试问题的回答

**Good Luck!** 🍀
