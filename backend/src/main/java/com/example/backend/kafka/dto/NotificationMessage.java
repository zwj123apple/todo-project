package com.example.backend.kafka.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Kafka消息DTO - 通知消息
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationMessage {
    private Long userId;
    private String title;
    private String content;
    private String type;  // INFO, WARNING, ERROR, SUCCESS
    private LocalDateTime timestamp;
}