package com.example.backend.controller;

import com.example.backend.exception.UnauthorizedException;
import com.example.backend.service.NotificationService;
import com.example.backend.util.JwtUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Tag(name = "通知管理", description = "实时通知相关接口")
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class NotificationController {

    private final NotificationService notificationService;
    private final JwtUtil jwtUtil;

    @Operation(summary = "建立SSE连接", description = "建立服务器推送事件连接，接收实时通知")
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamNotifications(@RequestParam("token") String token) {
        // 🎯 关键优化：直接从JWT token中提取userId，不查询数据库
        // 避免SSE长连接占用数据库连接导致连接泄漏
        try {
            Long userId = jwtUtil.extractUserId(token);
            if (userId == null) {
                throw new UnauthorizedException("无效的token");
            }
            return notificationService.createEmitter(userId);
        } catch (Exception e) {
            throw new UnauthorizedException("token解析失败: " + e.getMessage());
        }
    }
}
