package com.example.backend.kafka.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Kafka消息DTO - 任务事件
 * 面试要点：消息应该包含足够的信息，但不宜过大
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskEventMessage {
    private Long taskId;
    private String title;
    private String status;
    private String eventType;  // CREATED, UPDATED, DELETED
    private Long userId;
    private LocalDateTime timestamp;
    private String message;
}