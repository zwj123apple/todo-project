package com.example.backend.controller;

import com.example.backend.dto.ApiResponse;
import com.example.backend.dto.TaskStatisticsDTO;
import com.example.backend.entity.User;
import com.example.backend.exception.UnauthorizedException;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.StatisticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/statistics")
@RequiredArgsConstructor
@Tag(name = "Statistics", description = "统计数据管理接口")
@SecurityRequirement(name = "Bearer Authentication")
public class StatisticsController {
    
    private final StatisticsService statisticsService;
    private final UserRepository userRepository;
    
    @GetMapping("/tasks")
    @Operation(summary = "获取任务统计数据", description = "获取当前用户的任务统计信息")
    public ResponseEntity<ApiResponse<TaskStatisticsDTO>> getTaskStatistics(
            @Parameter(description = "统计天数，默认30天")
            @RequestParam(required = false) Integer days) {
        
        // 从 SecurityContext 获取当前认证用户
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        
        // 从数据库获取完整的 User 对象
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UnauthorizedException("用户不存在"));
        
        TaskStatisticsDTO statistics = statisticsService.getUserTaskStatistics(user, days);
        return ResponseEntity.ok(ApiResponse.success(statistics));
    }
}
