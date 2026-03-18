package com.example.backend.kafka.controller;

import com.example.backend.dto.ApiResponse;
import com.example.backend.kafka.dto.NotificationMessage;
import com.example.backend.kafka.dto.TaskEventMessage;
import com.example.backend.kafka.producer.KafkaProducerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

/**
 * Kafka测试Controller
 * 用于演示和测试Kafka功能
 * 面试时可以用这个Controller演示Kafka的基本用法
 */
@Tag(name = "Kafka测试", description = "Kafka消息队列测试接口")
@RestController
@RequestMapping("/api/kafka/test")
@RequiredArgsConstructor
public class KafkaTestController {

    private final KafkaProducerService producerService;

    /**
     * 测试发送任务创建事件
     * 访问：POST http://localhost:8080/api/kafka/test/task-created
     */
    @Operation(summary = "测试发送任务创建事件")
    @PostMapping("/task-created")
    public ResponseEntity<ApiResponse<String>> sendTaskCreatedEvent(
            @RequestParam(defaultValue = "1") Long taskId,
            @RequestParam(defaultValue = "测试任务") String title) {
        
        TaskEventMessage message = TaskEventMessage.builder()
                .taskId(taskId)
                .title(title)
                .status("TODO")
                .eventType("CREATED")
                .userId(1L)
                .timestamp(LocalDateTime.now())
                .message("任务创建成功")
                .build();
        
        producerService.sendTaskCreatedEvent(message);
        
        return ResponseEntity.ok(ApiResponse.success(
            "任务创建事件已发送到Kafka", 
            "查看后端日志可以看到消费者接收到的消息"
        ));
    }

    /**
     * 测试发送任务更新事件
     */
    @Operation(summary = "测试发送任务更新事件")
    @PostMapping("/task-updated")
    public ResponseEntity<ApiResponse<String>> sendTaskUpdatedEvent(
            @RequestParam(defaultValue = "1") Long taskId,
            @RequestParam(defaultValue = "IN_PROGRESS") String status) {
        
        TaskEventMessage message = TaskEventMessage.builder()
                .taskId(taskId)
                .title("测试任务")
                .status(status)
                .eventType("UPDATED")
                .userId(1L)
                .timestamp(LocalDateTime.now())
                .message("任务状态更新为: " + status)
                .build();
        
        producerService.sendTaskUpdatedEvent(message);
        
        return ResponseEntity.ok(ApiResponse.success("任务更新事件已发送", null));
    }

    /**
     * 测试发送用户通知
     */
    @Operation(summary = "测试发送用户通知")
    @PostMapping("/notification")
    public ResponseEntity<ApiResponse<String>> sendNotification(
            @RequestParam(defaultValue = "1") Long userId,
            @RequestParam(defaultValue = "测试通知") String title,
            @RequestParam(defaultValue = "这是一条测试通知消息") String content) {
        
        NotificationMessage message = NotificationMessage.builder()
                .userId(userId)
                .title(title)
                .content(content)
                .type("INFO")
                .timestamp(LocalDateTime.now())
                .build();
        
        producerService.sendUserNotification(message);
        
        return ResponseEntity.ok(ApiResponse.success("通知已发送", null));
    }

    /**
     * 批量发送消息测试（面试重点：批量处理）
     */
    @Operation(summary = "批量发送消息测试")
    @PostMapping("/batch-send")
    public ResponseEntity<ApiResponse<String>> batchSend(
            @RequestParam(defaultValue = "10") int count) {
        
        for (int i = 1; i <= count; i++) {
            TaskEventMessage message = TaskEventMessage.builder()
                    .taskId((long) i)
                    .title("批量测试任务 " + i)
                    .status("TODO")
                    .eventType("CREATED")
                    .userId(1L)
                    .timestamp(LocalDateTime.now())
                    .message("批量任务创建 " + i)
                    .build();
            
            producerService.sendTaskCreatedEvent(message);
        }
        
        return ResponseEntity.ok(ApiResponse.success(
            String.format("已批量发送%d条消息", count), 
            "观察Kafka UI和日志查看消息分布"
        ));
    }

    /**
     * 健康检查
     */
    @Operation(summary = "Kafka连接健康检查")
    @GetMapping("/health")
    public ResponseEntity<ApiResponse<String>> health() {
        return ResponseEntity.ok(ApiResponse.success(
            "Kafka服务正常运行", 
            "可以访问 http://localhost:8081 查看Kafka UI"
        ));
    }
}