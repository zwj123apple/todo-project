package com.example.backend.entity;

/**
 * 用户角色枚举
 * ROLE_USER: 普通用户，可以管理自己的任务
 * ROLE_ADMIN: 管理员，可以查看所有用户的任务和统计数据
 * ROLE_MANAGER: 管理者，可以查看团队任务统计
 */
public enum Role {
    ROLE_USER,      // 普通用户
    ROLE_MANAGER,   // 管理者
    ROLE_ADMIN      // 管理员
}