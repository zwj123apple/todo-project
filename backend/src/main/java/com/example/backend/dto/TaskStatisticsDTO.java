package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskStatisticsDTO {
    private Long totalTasks;
    private Long completedTasks;
    private Long pendingTasks;
    private Long inProgressTasks;
    private Map<String, Long> statusDistribution;
    private Map<String, Long> priorityDistribution;
    private Map<String, Long> completionTrend; // 日期 -> 完成数量
    private Map<String, Long> creationTrend; // 日期 -> 创建数量
    private Double completionRate;
}