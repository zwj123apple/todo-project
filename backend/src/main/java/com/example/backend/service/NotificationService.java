package com.example.backend.service;

import com.example.backend.dto.TaskDTO;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final ObjectMapper objectMapper;
    
    // 存储每个用户的SSE连接
    private final Map<Long, CopyOnWriteArrayList<SseEmitter>> userEmitters = new ConcurrentHashMap<>();
    
    /**
     * 创建SSE连接
     */
    public SseEmitter createEmitter(Long userId) {
        SseEmitter emitter = new SseEmitter(0L); // 0表示永不超时
        
        // 初始化用户的emitter列表
        userEmitters.putIfAbsent(userId, new CopyOnWriteArrayList<>());
        userEmitters.get(userId).add(emitter);
        
        log.info("用户 {} 建立SSE连接", userId);
        
        // 连接完成或超时时移除emitter
        emitter.onCompletion(() -> {
            log.info("用户 {} SSE连接完成", userId);
            removeEmitter(userId, emitter);
        });
        
        emitter.onTimeout(() -> {
            log.info("用户 {} SSE连接超时", userId);
            removeEmitter(userId, emitter);
        });
        
        emitter.onError((ex) -> {
            log.error("用户 {} SSE连接错误", userId, ex);
            removeEmitter(userId, emitter);
        });
        
        // 发送初始连接消息
        try {
            emitter.send(SseEmitter.event()
                .name("connected")
                .data("SSE连接已建立"));
        } catch (IOException e) {
            log.error("发送初始消息失败", e);
            removeEmitter(userId, emitter);
        }
        
        return emitter;
    }
    
    /**
     * 移除emitter
     */
    private void removeEmitter(Long userId, SseEmitter emitter) {
        CopyOnWriteArrayList<SseEmitter> emitters = userEmitters.get(userId);
        if (emitters != null) {
            emitters.remove(emitter);
            if (emitters.isEmpty()) {
                userEmitters.remove(userId);
            }
        }
    }
    
    /**
     * 发送任务创建通知
     */
    public void notifyTaskCreated(Long userId, TaskDTO task) {
        sendNotification(userId, "task_created", Map.of(
            "type", "task_created",
            "message", "新任务已创建",
            "task", task
        ));
    }
    
    /**
     * 发送任务更新通知
     */
    public void notifyTaskUpdated(Long userId, TaskDTO task) {
        sendNotification(userId, "task_updated", Map.of(
            "type", "task_updated",
            "message", "任务已更新",
            "task", task
        ));
    }
    
    /**
     * 发送任务删除通知
     */
    public void notifyTaskDeleted(Long userId, Long taskId) {
        sendNotification(userId, "task_deleted", Map.of(
            "type", "task_deleted",
            "message", "任务已删除",
            "taskId", taskId
        ));
    }
    
    /**
     * 发送任务状态变更通知
     */
    public void notifyTaskStatusChanged(Long userId, TaskDTO task, String oldStatus, String newStatus) {
        sendNotification(userId, "task_status_changed", Map.of(
            "type", "task_status_changed",
            "message", String.format("任务状态从 %s 变更为 %s", oldStatus, newStatus),
            "task", task,
            "oldStatus", oldStatus,
            "newStatus", newStatus
        ));
    }
    
    /**
     * 发送通用通知
     */
    private void sendNotification(Long userId, String eventName, Object data) {
        CopyOnWriteArrayList<SseEmitter> emitters = userEmitters.get(userId);
        if (emitters == null || emitters.isEmpty()) {
            log.debug("用户 {} 没有活跃的SSE连接", userId);
            return;
        }
        
        // 复制列表以避免并发修改
        for (SseEmitter emitter : new CopyOnWriteArrayList<>(emitters)) {
            try {
                String jsonData = objectMapper.writeValueAsString(data);
                emitter.send(SseEmitter.event()
                    .name(eventName)
                    .data(jsonData));
                log.debug("向用户 {} 发送通知: {}", userId, eventName);
            } catch (IOException e) {
                log.error("向用户 {} 发送通知失败", userId, e);
                removeEmitter(userId, emitter);
            }
        }
    }
    
    /**
     * 发送心跳包
     */
    public void sendHeartbeat() {
        userEmitters.forEach((userId, emitters) -> {
            for (SseEmitter emitter : new CopyOnWriteArrayList<>(emitters)) {
                try {
                    emitter.send(SseEmitter.event()
                        .name("heartbeat")
                        .data("ping"));
                } catch (IOException e) {
                    log.error("向用户 {} 发送心跳失败", userId, e);
                    removeEmitter(userId, emitter);
                }
            }
        });
    }
}