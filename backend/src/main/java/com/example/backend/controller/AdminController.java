package com.example.backend.controller;

import com.example.backend.dto.ApiResponse;
import com.example.backend.dto.UserDTO;
import com.example.backend.entity.User;
import com.example.backend.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 管理员控制器
 * 只有ADMIN角色可以访问这些接口
 */
@Tag(name = "Admin", description = "管理员API")
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class AdminController {

    private final UserService userService;

    @Operation(summary = "获取所有用户列表", description = "管理员查看所有用户")
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<UserDTO>>> getAllUsers() {
        List<UserDTO> users = userService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @Operation(summary = "更新用户角色", description = "管理员修改用户角色")
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/users/{userId}/role")
    public ResponseEntity<ApiResponse<UserDTO>> updateUserRole(
            @PathVariable Long userId,
            @RequestParam String role
    ) {
        UserDTO updatedUser = userService.updateUserRole(userId, User.UserRole.valueOf(role));
        return ResponseEntity.ok(ApiResponse.success("用户角色已更新", updatedUser));
    }

    @Operation(summary = "更新用户状态", description = "管理员修改用户状态(激活/停用/暂停)")
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/users/{userId}/status")
    public ResponseEntity<ApiResponse<UserDTO>> updateUserStatus(
            @PathVariable Long userId,
            @RequestParam String status
    ) {
        UserDTO updatedUser = userService.updateUserStatus(userId, User.UserStatus.valueOf(status));
        return ResponseEntity.ok(ApiResponse.success("用户状态已更新", updatedUser));
    }

    @Operation(summary = "删除用户", description = "管理员删除用户")
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/users/{userId}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long userId) {
        userService.deleteUser(userId);
        return ResponseEntity.ok(ApiResponse.success("用户已删除", null));
    }

    @Operation(summary = "获取系统统计信息", description = "管理员查看系统整体统计")
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/statistics")
    public ResponseEntity<ApiResponse<Object>> getSystemStatistics() {
        // 这里可以返回系统级别的统计信息
        return ResponseEntity.ok(ApiResponse.success(null, "系统统计功能待实现"));
    }
}