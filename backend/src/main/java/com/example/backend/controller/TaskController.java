package com.example.backend.controller;

import com.example.backend.dto.ApiResponse;
import com.example.backend.dto.TaskDTO;
import com.example.backend.dto.TaskRequest;
import com.example.backend.entity.User;
import com.example.backend.exception.UnauthorizedException;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {
    
    private final TaskService taskService;
    private final UserRepository userRepository;
    
    private User getCurrentUser(Authentication authentication) {
        String username = authentication.getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UnauthorizedException("用户不存在"));
    }
    
    @GetMapping
    public ResponseEntity<ApiResponse<List<TaskDTO>>> getAllTasks(Authentication authentication) {
        User user = getCurrentUser(authentication);
        List<TaskDTO> tasks = taskService.getAllTasksByUser(user.getId());
        return ResponseEntity.ok(ApiResponse.success(tasks));
    }
    
    @GetMapping("/status/{status}")
    public ResponseEntity<ApiResponse<List<TaskDTO>>> getTasksByStatus(
            Authentication authentication,
            @PathVariable String status) {
        User user = getCurrentUser(authentication);
        List<TaskDTO> tasks = taskService.getTasksByStatus(user.getId(), status);
        return ResponseEntity.ok(ApiResponse.success(tasks));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TaskDTO>> getTaskById(
            Authentication authentication,
            @PathVariable Long id) {
        User user = getCurrentUser(authentication);
        TaskDTO task = taskService.getTaskById(user.getId(), id);
        return ResponseEntity.ok(ApiResponse.success(task));
    }
    
    @PostMapping
    public ResponseEntity<ApiResponse<TaskDTO>> createTask(
            Authentication authentication,
            @Valid @RequestBody TaskRequest request) {
        User user = getCurrentUser(authentication);
        TaskDTO task = taskService.createTask(user.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("任务创建成功", task));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TaskDTO>> updateTask(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody TaskRequest request) {
        User user = getCurrentUser(authentication);
        TaskDTO task = taskService.updateTask(user.getId(), id, request);
        return ResponseEntity.ok(ApiResponse.success("任务更新成功", task));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTask(
            Authentication authentication,
            @PathVariable Long id) {
        User user = getCurrentUser(authentication);
        taskService.deleteTask(user.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("任务删除成功", null));
    }
}
