package com.example.backend.service;

import com.example.backend.dto.TaskDTO;
import com.example.backend.dto.TaskRequest;
import com.example.backend.entity.Tag;
import com.example.backend.entity.Task;
import com.example.backend.entity.User;
import com.example.backend.exception.BadRequestException;
import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.repository.TagRepository;
import com.example.backend.repository.TaskRepository;
import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TaskService {
    
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final TagRepository tagRepository;
    private final NotificationService notificationService;
    
    public List<TaskDTO> getAllTasksByUser(Long userId) {
        return taskRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(TaskDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    public List<TaskDTO> getTasksByStatus(Long userId, String status) {
        Task.TaskStatus taskStatus = Task.TaskStatus.valueOf(status.toUpperCase());
        return taskRepository.findByUserIdAndStatus(userId, taskStatus)
                .stream()
                .map(TaskDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    public TaskDTO getTaskById(Long userId, Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("任务不存在"));
        
        if (!task.getUser().getId().equals(userId)) {
            throw new BadRequestException("无权访问此任务");
        }
        
        return TaskDTO.fromEntity(task);
    }
    
    @Transactional
    public TaskDTO createTask(Long userId, TaskRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("用户不存在"));
        
        Task task = new Task();
        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setUser(user);
        
        if (request.getStatus() != null) {
            task.setStatus(Task.TaskStatus.valueOf(request.getStatus().toUpperCase()));
        }
        
        if (request.getPriority() != null) {
            task.setPriority(Task.TaskPriority.valueOf(request.getPriority().toUpperCase()));
        }
        
        task.setDueDate(request.getDueDate());
        
        if (request.getTagIds() != null && !request.getTagIds().isEmpty()) {
            Set<Tag> tags = new HashSet<>(tagRepository.findAllById(request.getTagIds()));
            task.setTags(tags);
        }
        
        Task savedTask = taskRepository.save(task);
        TaskDTO taskDTO = TaskDTO.fromEntity(savedTask);
        
        // 发送创建通知
        log.info("发送任务创建通知给用户 {}", userId);
        notificationService.notifyTaskCreated(userId, taskDTO);
        
        return taskDTO;
    }
    
    @Transactional
    public TaskDTO updateTask(Long userId, Long taskId, TaskRequest request) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("任务不存在"));
        
        if (!task.getUser().getId().equals(userId)) {
            throw new BadRequestException("无权修改此任务");
        }
        
        // 记录旧状态（用于状态变更通知）
        String oldStatus = task.getStatus().name();
        
        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        
        // 状态变更处理
        boolean statusChanged = false;
        if (request.getStatus() != null) {
            Task.TaskStatus newStatus = Task.TaskStatus.valueOf(request.getStatus().toUpperCase());
            if (!task.getStatus().equals(newStatus)) {
                statusChanged = true;
                log.info("任务 {} 状态从 {} 变更为 {}", taskId, oldStatus, newStatus);
            }
            
            if (newStatus == Task.TaskStatus.DONE && task.getStatus() != Task.TaskStatus.DONE) {
                task.setCompletedAt(LocalDateTime.now());
            } else if (newStatus != Task.TaskStatus.DONE) {
                task.setCompletedAt(null);
            }
            task.setStatus(newStatus);
        }
        
        if (request.getPriority() != null) {
            task.setPriority(Task.TaskPriority.valueOf(request.getPriority().toUpperCase()));
        }
        
        task.setDueDate(request.getDueDate());
        
        if (request.getTagIds() != null) {
            Set<Tag> tags = new HashSet<>(tagRepository.findAllById(request.getTagIds()));
            task.setTags(tags);
        }
        
        Task savedTask = taskRepository.save(task);
        TaskDTO taskDTO = TaskDTO.fromEntity(savedTask);
        
        // 根据是否状态变更发送不同的通知
        if (statusChanged) {
            log.info("发送任务状态变更通知给用户 {}", userId);
            notificationService.notifyTaskStatusChanged(userId, taskDTO, oldStatus, task.getStatus().name());
        } else {
            log.info("发送任务更新通知给用户 {}", userId);
            notificationService.notifyTaskUpdated(userId, taskDTO);
        }
        
        return taskDTO;
    }
    
    @Transactional
    public void deleteTask(Long userId, Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("任务不存在"));
        
        if (!task.getUser().getId().equals(userId)) {
            throw new BadRequestException("无权删除此任务");
        }
        
        taskRepository.delete(task);
        
        // 发送删除通知
        log.info("发送任务删除通知给用户 {}", userId);
        notificationService.notifyTaskDeleted(userId, taskId);
    }
}