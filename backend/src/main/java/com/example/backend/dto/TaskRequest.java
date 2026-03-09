package com.example.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class TaskRequest {
    
    @NotBlank(message = "任务标题不能为空")
    @Size(max = 200, message = "任务标题不能超过200个字符")
    private String title;
    
    private String description;
    private String status;
    private String priority;
    private LocalDateTime dueDate;
    private List<Long> tagIds;
}