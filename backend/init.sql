-- 创建数据库（如果需要）
CREATE DATABASE IF NOT EXISTS todopro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE todopro;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nickname VARCHAR(100),
    avatar VARCHAR(255),
    bio TEXT,
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login_at DATETIME,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 任务表
CREATE TABLE IF NOT EXISTS tasks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'TODO',
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    due_date DATETIME,
    completed_at DATETIME,
    user_id BIGINT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_due_date (due_date),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 标签表
CREATE TABLE IF NOT EXISTS tags (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7) DEFAULT '#3B82F6',
    user_id BIGINT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_name (name),
    UNIQUE KEY uk_user_tag (user_id, name),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 任务标签关联表（多对多）
CREATE TABLE IF NOT EXISTS task_tags (
    task_id BIGINT NOT NULL,
    tag_id BIGINT NOT NULL,
    PRIMARY KEY (task_id, tag_id),
    INDEX idx_task_id (task_id),
    INDEX idx_tag_id (tag_id),
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 刷新令牌表
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    token VARCHAR(255) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    expiry_date DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_token (token),
    INDEX idx_user_id (user_id),
    INDEX idx_expiry_date (expiry_date),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入一个测试管理员用户（密码: admin123，使用 BCrypt 加密）
-- 注意：这个密码哈希是 "admin123" 的 BCrypt 加密结果
INSERT INTO users (username, email, password, nickname, role, status) 
VALUES (
    'admin',
    'admin@todopro.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    '管理员',
    'ADMIN',
    'ACTIVE'
) ON DUPLICATE KEY UPDATE username=username;

-- 插入一个测试普通用户（密码: user123）
INSERT INTO users (username, email, password, nickname, role, status) 
VALUES (
    'testuser',
    'test@todopro.com',
    '$2a$10$8TiS2D5YaGCXZqPaXlxVy.Ut9Nv/vLs2LXRzMGPrSKTqIGFk3HGSO',
    '测试用户',
    'USER',
    'ACTIVE'
) ON DUPLICATE KEY UPDATE username=username;

-- 为管理员用户插入默认标签
INSERT INTO tags (name, color, user_id) 
SELECT '工作', '#EF4444', id FROM users WHERE username = 'admin'
ON DUPLICATE KEY UPDATE name=name;

INSERT INTO tags (name, color, user_id) 
SELECT '个人', '#3B82F6', id FROM users WHERE username = 'admin'
ON DUPLICATE KEY UPDATE name=name;

INSERT INTO tags (name, color, user_id) 
SELECT '学习', '#10B981', id FROM users WHERE username = 'admin'
ON DUPLICATE KEY UPDATE name=name;

INSERT INTO tags (name, color, user_id) 
SELECT '紧急', '#F59E0B', id FROM users WHERE username = 'admin'
ON DUPLICATE KEY UPDATE name=name;

INSERT INTO tags (name, color, user_id) 
SELECT '重要', '#8B5CF6', id FROM users WHERE username = 'admin'
ON DUPLICATE KEY UPDATE name=name;

-- 为测试用户插入默认标签
INSERT INTO tags (name, color, user_id) 
SELECT '工作', '#EF4444', id FROM users WHERE username = 'testuser'
ON DUPLICATE KEY UPDATE name=name;

INSERT INTO tags (name, color, user_id) 
SELECT '个人', '#3B82F6', id FROM users WHERE username = 'testuser'
ON DUPLICATE KEY UPDATE name=name;

INSERT INTO tags (name, color, user_id) 
SELECT '学习', '#10B981', id FROM users WHERE username = 'testuser'
ON DUPLICATE KEY UPDATE name=name;

INSERT INTO tags (name, color, user_id) 
SELECT '紧急', '#F59E0B', id FROM users WHERE username = 'testuser'
ON DUPLICATE KEY UPDATE name=name;

INSERT INTO tags (name, color, user_id) 
SELECT '重要', '#8B5CF6', id FROM users WHERE username = 'testuser'
ON DUPLICATE KEY UPDATE name=name;

-- 为测试用户插入一些示例任务
INSERT INTO tasks (title, description, status, priority, user_id, due_date) 
SELECT 
    '完成项目文档',
    '编写项目的技术文档和用户手册',
    'TODO',
    'HIGH',
    id,
    DATE_ADD(NOW(), INTERVAL 7 DAY)
FROM users WHERE username = 'testuser'
ON DUPLICATE KEY UPDATE title=title;

INSERT INTO tasks (title, description, status, priority, user_id, due_date) 
SELECT 
    '学习新技术',
    '学习 React 和 Spring Boot 的最新特性',
    'IN_PROGRESS',
    'MEDIUM',
    id,
    DATE_ADD(NOW(), INTERVAL 14 DAY)
FROM users WHERE username = 'testuser'
ON DUPLICATE KEY UPDATE title=title;

INSERT INTO tasks (title, description, status, priority, user_id, completed_at) 
SELECT 
    '设置开发环境',
    '安装和配置所有必需的开发工具',
    'DONE',
    'HIGH',
    id,
    DATE_SUB(NOW(), INTERVAL 2 DAY)
FROM users WHERE username = 'testuser'
ON DUPLICATE KEY UPDATE title=title;

-- 关联任务和标签
INSERT INTO task_tags (task_id, tag_id)
SELECT t.id, tag.id
FROM tasks t
CROSS JOIN tags tag
CROSS JOIN users u
WHERE t.user_id = u.id 
  AND tag.user_id = u.id
  AND u.username = 'testuser'
  AND t.title = '完成项目文档'
  AND tag.name = '工作'
ON DUPLICATE KEY UPDATE task_id=task_id;

INSERT INTO task_tags (task_id, tag_id)
SELECT t.id, tag.id
FROM tasks t
CROSS JOIN tags tag
CROSS JOIN users u
WHERE t.user_id = u.id 
  AND tag.user_id = u.id
  AND u.username = 'testuser'
  AND t.title = '学习新技术'
  AND tag.name = '学习'
ON DUPLICATE KEY UPDATE task_id=task_id;

-- 文件元数据表
CREATE TABLE IF NOT EXISTS file_metadata (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_identifier VARCHAR(255) NOT NULL UNIQUE,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    user_id BIGINT NOT NULL,
    total_chunks INT NOT NULL,
    uploaded_chunks INT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'UPLOADING',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_file_identifier (file_identifier),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 分片元数据表
CREATE TABLE IF NOT EXISTS chunk_metadata (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    file_identifier VARCHAR(255) NOT NULL,
    chunk_number INT NOT NULL,
    chunk_size BIGINT NOT NULL,
    chunk_path VARCHAR(500) NOT NULL,
    uploaded BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_file_identifier (file_identifier),
    INDEX idx_chunk_number (chunk_number),
    UNIQUE KEY uk_file_chunk (file_identifier, chunk_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 完成
SELECT 'Database initialization completed successfully!' AS Message;
