package com.example.backend.kafka;

import com.example.backend.kafka.dto.TaskEventMessage;
import com.example.backend.kafka.producer.KafkaProducerService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.kafka.test.context.EmbeddedKafka;
import org.springframework.test.annotation.DirtiesContext;

import java.time.LocalDateTime;
import java.util.concurrent.TimeUnit;

/**
 * Kafka集成测试
 * 面试要点：
 * 1. @EmbeddedKafka：嵌入式Kafka，用于测试
 * 2. 异步测试的等待处理
 * 3. 测试隔离
 */
@SpringBootTest
@DirtiesContext
@EmbeddedKafka(
    partitions = 1,
    topics = {"task-created-topic", "task-updated-topic"},
    brokerProperties = {"listeners=PLAINTEXT://localhost:9092", "port=9092"}
)
class KafkaIntegrationTest {

    @Autowired
    private KafkaProducerService producerService;

    @Test
    void testSendTaskCreatedEvent() throws Exception {
        // 创建测试消息
        TaskEventMessage message = TaskEventMessage.builder()
                .taskId(1L)
                .title("测试任务")
                .status("TODO")
                .eventType("CREATED")
                .userId(1L)
                .timestamp(LocalDateTime.now())
                .message("测试消息")
                .build();

        // 发送消息
        producerService.sendTaskCreatedEvent(message);

        // 等待消息被消费（异步处理）
        TimeUnit.SECONDS.sleep(3);

        // 在实际测试中，你可以验证消息是否被正确消费
        // 这里仅作演示
    }
}
