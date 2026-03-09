package com.example.backend.service;

import com.example.backend.dto.TaskStatisticsDTO;
import com.example.backend.entity.Task;
import com.example.backend.entity.User;
import com.example.backend.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class StatisticsService {
    
    private final TaskRepository taskRepository;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    
    @Transactional(readOnly = true)
    public TaskStatisticsDTO getUserTaskStatistics(User user, Integer days) {
        // 获取基本统计
        Long totalTasks = taskRepository.countByUser(user);
        Long completedTasks = taskRepository.countByUserIdAndStatus(user.getId(), Task.TaskStatus.DONE);
        Long pendingTasks = taskRepository.countByUserIdAndStatus(user.getId(), Task.TaskStatus.TODO);
        Long inProgressTasks = taskRepository.countByUserIdAndStatus(user.getId(), Task.TaskStatus.IN_PROGRESS);
        
        // 计算完成率
        Double completionRate = totalTasks > 0 ? (completedTasks.doubleValue() / totalTasks.doubleValue()) * 100 : 0.0;
        
        // 获取状态分布
        Map<String, Long> statusDistribution = new HashMap<>();
        List<Object[]> statusResults = taskRepository.countByUserGroupByStatus(user);
        for (Object[] result : statusResults) {
            Task.TaskStatus status = (Task.TaskStatus) result[0];
            Long count = (Long) result[1];
            statusDistribution.put(status.name(), count);
        }
        
        // 获取优先级分布
        Map<String, Long> priorityDistribution = new HashMap<>();
        List<Object[]> priorityResults = taskRepository.countByUserGroupByPriority(user);
        for (Object[] result : priorityResults) {
            Task.TaskPriority priority = (Task.TaskPriority) result[0];
            Long count = (Long) result[1];
            priorityDistribution.put(priority.name(), count);
        }
        
        // 获取趋势数据（默认30天）
        int trendDays = days != null ? days : 30;
        LocalDateTime startDate = LocalDateTime.now().minusDays(trendDays);
        
        // 创建趋势数据
        Map<String, Long> creationTrend = initializeTrendMap(trendDays);
        List<Object[]> creationResults = taskRepository.countCreationTrendByUser(user, startDate);
        for (Object[] result : creationResults) {
            LocalDate date = ((java.sql.Date) result[0]).toLocalDate();
            Long count = (Long) result[1];
            creationTrend.put(date.format(DATE_FORMATTER), count);
        }
        
        Map<String, Long> completionTrend = initializeTrendMap(trendDays);
        List<Object[]> completionResults = taskRepository.countCompletionTrendByUser(user, startDate);
        for (Object[] result : completionResults) {
            LocalDate date = ((java.sql.Date) result[0]).toLocalDate();
            Long count = (Long) result[1];
            completionTrend.put(date.format(DATE_FORMATTER), count);
        }
        
        return TaskStatisticsDTO.builder()
                .totalTasks(totalTasks)
                .completedTasks(completedTasks)
                .pendingTasks(pendingTasks)
                .inProgressTasks(inProgressTasks)
                .statusDistribution(statusDistribution)
                .priorityDistribution(priorityDistribution)
                .creationTrend(creationTrend)
                .completionTrend(completionTrend)
                .completionRate(completionRate)
                .build();
    }
    
    private Map<String, Long> initializeTrendMap(int days) {
        Map<String, Long> trendMap = new HashMap<>();
        LocalDate today = LocalDate.now();
        for (int i = days - 1; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            trendMap.put(date.format(DATE_FORMATTER), 0L);
        }
        return trendMap;
    }
}