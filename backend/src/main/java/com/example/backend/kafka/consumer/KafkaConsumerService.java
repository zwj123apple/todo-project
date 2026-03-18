package com.example.backend.kafka.consumer;

import com.example.backend.kafka.dto.NotificationMessage;
import com.example.backend.kafka.dto.TaskEventMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Service;

/**
 * Kafka消费者服务
 * 面试重点：
 * 1. @KafkaListener注解的使用
 * 2. 消费者组（group-id）的概念
 * 3. 消息消费的幂等性处理
 * 4. 异常处理和重试机制
 */
@Slf4j
@Service
public class KafkaConsumerService {

    /**
     * 监听任务创建事件
     * 面试要点：
     * - topics: 监听的主题
     * - groupId: 消费者组ID，同组的消费者负载均衡消费
     * - containerFactory: 使用的监听器工厂
     */
    @KafkaListener(
        topics = "task-created-topic",
        groupId = "task-consumer-group",
        containerFactory = "kafkaListenerContainerFactory"
    )
    public void listenTaskCreated(
            @Payload TaskEventMessage message,
            @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
            @Header(KafkaHeaders.OFFSET) long offset) {
        
        log.info("====== 消费任务创建事件 ======");
        log.info("Partition: {}, Offset: {}", partition, offset);
        log.info("Message: {}", message);
        log.info("============================");
        
        // 实际业务处理
        // 例如：发送通知、更新统计、触发其他服务等
        try {
            processTaskCreatedEvent(message);
        } catch (Exception e) {
            log.error("处理任务创建事件失败: {}", e.getMessage());
            // 面试要点：这里可以讨论重试机制、死信队列等
        }
    }

    /**
     * 监听任务更新事件
     */
    @KafkaListener(
        topics = "task-updated-topic",
        groupId = "task-consumer-group"
    )
    public void listenTaskUpdated(@Payload TaskEventMessage message) {
        log.info("====== 消费任务更新事件 ======");
        log.info("Message: {}", message);
        log.info("============================");
        
        try {
            processTaskUpdatedEvent(message);
        } catch (Exception e) {
            log.error("处理任务更新事件失败: {}", e.getMessage());
        }
    }

    /**
     * 监听用户通知
     * 面试要点：多个消费者可以监听同一个主题但属于不同的消费者组
     */
    @KafkaListener(
        topics = "user-notification-topic",
        groupId = "notification-consumer-group"
    )
    public void listenUserNotification(@Payload NotificationMessage message) {
        log.info("====== 消费用户通知 ======");
        log.info("Message: {}", message);
        log.info("============================");
        
        try {
            processUserNotification(message);
        } catch (Exception e) {
            log.error("处理用户通知失败: {}", e.getMessage());
        }
    }

    // 业务处理方法
    private void processTaskCreatedEvent(TaskEventMessage message) {
        log.info("处理任务创建事件: taskId={}, title={}", message.getTaskId(), message.getTitle());
        // 实际业务逻辑：
        // 1. 发送邮件通知
        // 2. 更新统计数据
        // 3. 触发其他微服务
    }

    private void processTaskUpdatedEvent(TaskEventMessage message) {
        log.info("处理任务更新事件: taskId={}, status={}", message.getTaskId(), message.getStatus());
        // 实际业务逻辑
    }

    private void processUserNotification(NotificationMessage message) {
        log.info("处理用户通知: userId={}, title={}", message.getUserId(), message.getTitle());
        // 实际业务逻辑：推送通知到前端、发送短信等
    }
}
