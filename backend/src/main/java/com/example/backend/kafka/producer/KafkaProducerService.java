package com.example.backend.kafka.producer;

import com.example.backend.kafka.dto.NotificationMessage;
import com.example.backend.kafka.dto.TaskEventMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

/**
 * Kafka生产者服务
 * 面试重点：
 * 1. 异步发送消息
 * 2. 发送结果回调处理
 * 3. 异常处理
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class KafkaProducerService {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    /**
     * 发送任务创建事件
     * 面试要点：分区键（key）的选择很重要，决定消息发送到哪个分区
     */
    public void sendTaskCreatedEvent(TaskEventMessage message) {
        String topic = "task-created-topic";
        String key = String.valueOf(message.getTaskId());
        
        log.info("发送任务创建事件: topic={}, key={}, message={}", topic, key, message);
        
        CompletableFuture<SendResult<String, Object>> future = 
            kafkaTemplate.send(topic, key, message);
        
        // 异步回调处理
        future.whenComplete((result, ex) -> {
            if (ex == null) {
                log.info("消息发送成功: offset={}, partition={}", 
                    result.getRecordMetadata().offset(),
                    result.getRecordMetadata().partition());
            } else {
                log.error("消息发送失败: {}", ex.getMessage());
            }
        });
    }

    /**
     * 发送任务更新事件
     */
    public void sendTaskUpdatedEvent(TaskEventMessage message) {
        String topic = "task-updated-topic";
        String key = String.valueOf(message.getTaskId());
        
        log.info("发送任务更新事件: topic={}, key={}, message={}", topic, key, message);
        
        kafkaTemplate.send(topic, key, message)
            .whenComplete((result, ex) -> {
                if (ex == null) {
                    log.info("任务更新事件发送成功");
                } else {
                    log.error("任务更新事件发送失败: {}", ex.getMessage());
                }
            });
    }

    /**
     * 发送用户通知
     */
    public void sendUserNotification(NotificationMessage message) {
        String topic = "user-notification-topic";
        String key = String.valueOf(message.getUserId());
        
        log.info("发送用户通知: topic={}, key={}, message={}", topic, key, message);
        
        kafkaTemplate.send(topic, key, message)
            .whenComplete((result, ex) -> {
                if (ex == null) {
                    log.info("用户通知发送成功");
                } else {
                    log.error("用户通知发送失败: {}", ex.getMessage());
                }
            });
    }

    /**
     * 同步发送消息（面试要点：同步vs异步）
     */
    public SendResult<String, Object> sendMessageSync(String topic, String key, Object message) {
        try {
            log.info("同步发送消息: topic={}, key={}", topic, key);
            return kafkaTemplate.send(topic, key, message).get();
        } catch (Exception e) {
            log.error("同步发送消息失败: {}", e.getMessage());
            throw new RuntimeException("Failed to send message", e);
        }
    }
}