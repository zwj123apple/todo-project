# 🐳 Docker Compose 一键部署指南

## 📋 目录

- [前提条件](#前提条件)
- [快速开始](#快速开始)
- [详细步骤](#详细步骤)
- [配置说明](#配置说明)
- [常用命令](#常用命令)
- [故障排除](#故障排除)

## 🔧 前提条件

### 必需软件

- **Docker**: 20.10+
- **Docker Compose**: 2.0+

### 安装Docker

#### Windows

1. 下载 [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop)
2. 运行安装程序
3. 重启电脑
4. 打开Docker Desktop，确保Docker引擎正在运行

#### macOS

```bash
# 使用Homebrew安装
brew install --cask docker

# 或下载Docker Desktop for Mac
# https://www.docker.com/products/docker-desktop
```

#### Linux (Ubuntu/Debian)

```bash
# 安装Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version
```

### 验证安装

```bash
docker --version
# Docker version 20.10.x

docker-compose --version
# Docker Compose version v2.x.x
```

## 🚀 快速开始

### 一键启动（推荐）

```bash
# 1. 克隆项目（如果还没有）
git clone <your-repo-url>
cd todo-project

# 2. 一键启动所有服务
docker-compose up -d

# 3. 等待服务启动（首次启动需要3-5分钟）
# 查看启动进度
docker-compose logs -f

# 4. 访问应用
# 前端: http://localhost
# 后端API: http://localhost:8080
# Swagger: http://localhost:8080/swagger-ui.html
```

就这么简单！🎉

## 📝 详细步骤

### 步骤 1: 准备项目文件

确保项目根目录包含以下文件：

```
todo-project/
├── docker-compose.yml       ✅ Docker编排配置
├── backend/
│   ├── Dockerfile          ✅ 后端Docker镜像
│   ├── pom.xml
│   ├── init.sql            ✅ 数据库初始化脚本
│   └── src/
└── frontend/
    ├── Dockerfile          ✅ 前端Docker镜像
    ├── nginx.conf          ✅ Nginx配置
    ├── package.json
    └── src/
```

### 步骤 2: 构建并启动服务

```bash
# 构建并启动所有服务（后台运行）
docker-compose up -d --build

# 如果不需要重新构建，只启动：
docker-compose up -d
```

### 步骤 3: 查看服务状态

```bash
# 查看所有服务状态
docker-compose ps

# 应该看到3个服务都在运行：
# NAME                    STATUS              PORTS
# todo-project-db-1       running             0.0.0.0:5432->5432/tcp
# todo-project-backend-1  running             0.0.0.0:8080->8080/tcp
# todo-project-frontend-1 running             0.0.0.0:80->80/tcp
```

### 步骤 4: 查看日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

### 步骤 5: 访问应用

#### 前端应用

- URL: http://localhost
- 默认端口: 80

#### 后端API

- API Base: http://localhost:8080/api
- Swagger UI: http://localhost:8080/swagger-ui.html
- 健康检查: http://localhost:8080/actuator/health

#### 数据库

- Host: localhost
- Port: 5432
- Database: tododb
- Username: postgres
- Password: postgres

### 步骤 6: 创建管理员账号

```bash
# 进入数据库容器
docker-compose exec db psql -U postgres -d tododb

# 执行SQL
UPDATE users SET role = 'ADMIN' WHERE username = 'your_username';

# 退出
\q
```

或使用外部工具连接：

```bash
psql -h localhost -p 5432 -U postgres -d tododb
# 密码: postgres
```

## ⚙️ 配置说明

### docker-compose.yml 详解

```yaml
version: "3.8"

services:
  # PostgreSQL 数据库
  db:
    image: postgres:15
    container_name: todo-db
    environment:
      POSTGRES_DB: tododb # 数据库名
      POSTGRES_USER: postgres # 用户名
      POSTGRES_PASSWORD: postgres # 密码
    volumes:
      - postgres_/var/lib/postgresql/data # 数据持久化
      - ./backend/init.sql:/docker-entrypoint-initdb.d/init.sql # 初始化脚本
    ports:
      - "5432:5432" # 暴露端口
    networks:
      - todo-network

  # Spring Boot 后端
  backend:
    build: ./backend
    container_name: todo-backend
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/tododb
      SPRING_DATASOURCE_USERNAME: postgres
      SPRING_DATASOURCE_PASSWORD: postgres
      SPRING_JPA_HIBERNATE_DDL_AUTO: update
    ports:
      - "8080:8080"
    depends_on:
      - db # 等待数据库启动
    networks:
      - todo-network

  # React 前端
  frontend:
    build: ./frontend
    container_name: todo-frontend
    ports:
      - "80:80" # Nginx默认端口
    depends_on:
      - backend # 等待后端启动
    networks:
      - todo-network

volumes: postgres_ # 数据库数据持久化

networks:
  todo-network: # 容器间通信网络
    driver: bridge
```

### 环境变量配置

可以创建`.env`文件来覆盖默认配置：

```bash
# .env 文件
POSTGRES_DB=tododb
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password

BACKEND_PORT=8080
FRONTEND_PORT=80

JWT_SECRET=your_jwt_secret_key
JWT_EXPIRATION=86400000
```

然后在docker-compose.yml中使用：

```yaml
environment:
  POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
```

## 📦 常用命令

### 启动服务

```bash
# 启动所有服务
docker-compose up -d

# 启动特定服务
docker-compose up -d backend

# 查看启动日志
docker-compose logs -f
```

### 停止服务

```bash
# 停止所有服务
docker-compose stop

# 停止特定服务
docker-compose stop backend

# 停止并删除容器
docker-compose down

# 停止并删除容器+数据卷（⚠️ 会删除数据库数据）
docker-compose down -v
```

### 重启服务

```bash
# 重启所有服务
docker-compose restart

# 重启特定服务
docker-compose restart backend
```

### 查看状态

```bash
# 查看服务状态
docker-compose ps

# 查看服务日志
docker-compose logs -f backend

# 查看容器资源使用
docker stats
```

### 进入容器

```bash
# 进入后端容器
docker-compose exec backend /bin/bash

# 进入数据库容器
docker-compose exec db psql -U postgres -d tododb

# 进入前端容器
docker-compose exec frontend /bin/sh
```

### 重新构建

```bash
# 重新构建所有镜像
docker-compose build

# 重新构建特定服务
docker-compose build backend

# 强制重新构建（不使用缓存）
docker-compose build --no-cache

# 重新构建并启动
docker-compose up -d --build
```

### 清理资源

```bash
# 删除停止的容器
docker-compose rm

# 删除未使用的镜像
docker image prune -a

# 删除未使用的卷
docker volume prune

# 清理所有未使用的资源
docker system prune -a
```

## 🐛 故障排除

### 问题 1: 端口被占用

**错误信息**:

```
Error: bind: address already in use
```

**解决方法**:

```bash
# 查看端口占用
# Windows
netstat -ano | findstr :8080

# macOS/Linux
lsof -i :8080

# 方法1: 杀死占用进程
kill -9 <PID>

# 方法2: 修改docker-compose.yml的端口映射
ports:
  - "8081:8080"  # 改用8081端口
```

### 问题 2: 数据库连接失败

**错误信息**:

```
Connection refused或Connection timeout
```

**解决方法**:

```bash
# 1. 检查数据库容器状态
docker-compose ps db

# 2. 查看数据库日志
docker-compose logs db

# 3. 检查数据库是否就绪
docker-compose exec db pg_isready -U postgres

# 4. 手动连接测试
docker-compose exec db psql -U postgres -d tododb
```

### 问题 3: 后端启动失败

**解决方法**:

```bash
# 1. 查看后端日志
docker-compose logs backend

# 2. 检查数据库是否先启动
docker-compose ps

# 3. 重启后端服务
docker-compose restart backend

# 4. 如果是代码问题，重新构建
docker-compose up -d --build backend
```

### 问题 4: 前端无法访问后端API

**解决方法**:

```bash
# 1. 检查前端环境变量
# frontend/Dockerfile中的ARG VITE_API_BASE_URL

# 2. 检查Nginx配置
# frontend/nginx.conf中的proxy_pass

# 3. 测试后端API是否可访问
curl http://localhost:8080/api/auth/login

# 4. 重新构建前端
docker-compose up -d --build frontend
```

### 问题 5: 数据持久化问题

**检查数据卷**:

```bash
# 查看数据卷
docker volume ls

# 查看数据卷详情
docker volume inspect todo-project_postgres_data

# 备份数据
docker-compose exec db pg_dump -U postgres tododb > backup.sql

# 恢复数据
docker-compose exec -T db psql -U postgres -d tododb < backup.sql
```

### 问题 6: 内存不足

**解决方法**:

```bash
# 限制容器内存使用
# 在docker-compose.yml中添加：
services:
  backend:
    mem_limit: 1g
    memswap_limit: 1g
```

## 📊 性能优化

### 1. 使用多阶段构建

```dockerfile
# backend/Dockerfile
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### 2. 优化镜像大小

```bash
# 查看镜像大小
docker images

# 使用alpine基础镜像
FROM node:18-alpine
FROM eclipse-temurin:17-jre-alpine
```

### 3. 使用构建缓存

```bash
# 利用Docker缓存加速构建
docker-compose build --parallel
```

## 🔒 安全建议

### 1. 使用环境变量

```bash
# 不要在docker-compose.yml中硬编码密码
# 使用.env文件或Docker secrets
```

### 2. 最小权限原则

```yaml
# 使用非root用户运行容器
USER node
```

### 3. 定期更新镜像

```bash
# 更新基础镜像
docker-compose pull
docker-compose up -d
```

## 📈 监控和日志

### 查看日志

```bash
# 实时查看所有日志
docker-compose logs -f

# 查看最近100行日志
docker-compose logs --tail=100

# 导出日志到文件
docker-compose logs > logs.txt
```

### 监控资源使用

```bash
# 查看容器资源使用
docker stats

# 查看特定容器
docker stats todo-backen
```
