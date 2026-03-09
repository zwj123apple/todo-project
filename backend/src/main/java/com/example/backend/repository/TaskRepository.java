package com.example.backend.repository;

import com.example.backend.entity.Task;
import com.example.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByUser(User user);
    List<Task> findByUserAndStatus(User user, String status);
    List<Task> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Task> findByUserIdAndStatus(Long userId, Task.TaskStatus status);
    
    Optional<Task> findByIdAndUser(Long id, User user);
    
    // 统计查询方法
    @Query("SELECT COUNT(t) FROM Task t WHERE t.user = :user")
    Long countByUser(@Param("user") User user);
    
    Long countByUserIdAndStatus(Long userId, Task.TaskStatus status);
    
    @Query("SELECT t.status, COUNT(t) FROM Task t WHERE t.user = :user GROUP BY t.status")
    List<Object[]> countByUserGroupByStatus(@Param("user") User user);
    
    @Query("SELECT t.priority, COUNT(t) FROM Task t WHERE t.user = :user GROUP BY t.priority")
    List<Object[]> countByUserGroupByPriority(@Param("user") User user);
    
    @Query("SELECT DATE(t.createdAt), COUNT(t) FROM Task t WHERE t.user = :user AND t.createdAt >= :startDate GROUP BY DATE(t.createdAt) ORDER BY DATE(t.createdAt)")
    List<Object[]> countCreationTrendByUser(@Param("user") User user, @Param("startDate") LocalDateTime startDate);
    
    @Query("SELECT DATE(t.updatedAt), COUNT(t) FROM Task t WHERE t.user = :user AND t.status = 'DONE' AND t.updatedAt >= :startDate GROUP BY DATE(t.updatedAt) ORDER BY DATE(t.updatedAt)")
    List<Object[]> countCompletionTrendByUser(@Param("user") User user, @Param("startDate") LocalDateTime startDate);
}