# 🐳 Day 12: Docker Compose 一键部署完整指南

## ✅ 当前配置

本项目使用以下技术栈：

- **数据库**: MySQL 8.0
- **缓存**: Redis 7
- **后端**: Spring Boot 3 (端口: 8080)
- **前端**: React + Vite (端口: 5173)

## 🚀 一键部署（3分钟搞定）

```bash
# 1. 确保在项目根目录
cd todo-project

# 2. 一键启动所有服务
docker-compose up -d

# 3. 查看启动状态
docker-compose ps

# 4. 查看日志（可选）
docker-compose logs -f

# 5. 访问应用
# 前端: http://localhost:5173
# 后端: http://localhost:8080
# Swagger: http://localhost:8080/swagger-ui.html
```

就这么简单！🎉

## 📋 详细部署步骤

### 步骤 0: 环境准备

#### 安装 Docker Desktop (Windows/Mac)

1. 下载 [Docker Desktop](https://www.docker.com/products/docker-desktop)
2. 安装并启动
3. 验证安装：

```bash
docker --version
docker-compose --version
```

#### Linux用户

```bash
# 安装Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 验证
docker --version
docker-compose --version
```

### 步骤 1: 项目结构检查

确保以下文件存在：

```
todo-project/
├── docker-compose.yml         ✅ 必需
├── backend/
│   ├── Dockerfile            ✅ 必需
│   ├── pom.xml               ✅ 必需
│   ├── init.sql              ✅ 数据库初始化
│   └── src/                  ✅ 源代码
└── frontend/
    ├── Dockerfile            ✅ 必需
    ├── nginx.conf            ✅ Nginx配置
    ├── package.json          ✅ 必需
    └── src/                  ✅ 源代码
```

### 步骤 2: 启动服务

```bash
# 方式1: 前台启动（可以看到实时日志）
docker-compose up

# 方式2: 后台启动（推荐）
docker-compose up -d

# 方式3: 强制重新构建
docker-compose up -d --build
```

首次启动需要：

- 📥 下载基础镜像 (约1-2分钟)
- 🔨 构建应用镜像 (约2-3分钟)
- 🚀 启动所有服务 (约30秒)

**总计: 约3-5分钟**

### 步骤 3: 验证服务状态

```bash
# 查看所有容器状态
docker-compose ps

# 应该看到4个容器都在运行：
NAME                    STATUS              PORTS
todopro-mysql           Up (healthy)        0.0.0.0:3306->3306/tcp
todopro-redis           Up (healthy)        0.0.0.0:6379->6379/tcp
todopro-backend         Up                  0.0.0.0:8080->8080/tcp
todopro-frontend        Up                  0.0.0.0:5173->5173/tcp
```

### 步骤 4: 查看日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f mysql
docker-compose logs -f redis
docker-compose logs -f backend
docker-compose logs -f frontend

# 查看最后100行日志
docker-compose logs --tail=100 backend
```

### 步骤 5: 访问应用

#### 🌐 前端应用

- URL: **http://localhost:5173**
- 功能: 完整的React应用

#### 🔧 后端API

- API基础URL: **http://localhost:8080/api**
- Swagger文档: **http://localhost:8080/swagger-ui.html**
- 健康检查: **http://localhost:8080/actuator/health**

#### 📊 测试API

```bash
# 测试登录接口
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

#### 💾 数据库访问

- Host: localhost
- Port: 3306
- Database: todopro
- Username: todopro
- Password: todopro

```bash
# 使用Docker连接
docker-compose exec mysql mysql -utodopro -ptodopro todopro

# 或使用本地MySQL客户端
mysql -h localhost -P 3306 -u todopro -ptodopro todopro
```

#### 🔴 Redis访问

- Host: localhost
- Port: 6379

```bash
# 使用Docker连接
docker-compose exec redis redis-cli

# 测试
> PING
PONG
```

### 步骤 6: 创建管理员账号

```bash
# 方式1: 通过Docker连接数据库
docker-compose exec mysql mysql -utodopro -ptodopro todopro

# 执行SQL
UPDATE users SET role = 'ADMIN' WHERE username = 'your_username';
exit;

# 方式2: 使用SQL文件
echo "UPDATE users SET role = 'ADMIN' WHERE username = 'admin';" | docker-compose exec -T mysql mysql -utodopro -ptodopro todopro
```

## ⚙️ 配置详解

### docker-compose.yml 完整配置

```yaml
version: "3.8"

services:
  # MySQL 数据库
  mysql:
    image: mysql:8.0
    container_name: todopro-mysql
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: todopro
      MYSQL_USER: todopro
      MYSQL_PASSWORD: todopro
    ports:
      - "3306:3306"
    volumes:
      - mysql-/var/lib/mysql              # 数据持久化
      - ./backend/init.sql:/docker-entrypoint-initdb.d/init.sql  # 初始化脚本
    command: --default-authentication-plugin=mysql_native_password --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      timeout: 20s
      retries: 10

  # Redis 缓存
  redis:
    image: redis:7-alpine
    container_name: todopro-redis
    ports:
      - "6379:6379"
    volumes:
      - redis-/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      timeout: 3s
      retries: 10

  # Spring Boot 后端
  backend:
    build: ./backend
    container_name: todopro-backend
    ports:
      - "8080:8080"
    environment:
      SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/todopro?useSSL=false&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true
      SPRING_DATASOURCE_USERNAME: todopro
      SPRING_DATASOURCE_PASSWORD: todopro
      SPRING_REDIS_HOST: redis
      SPRING_REDIS_PORT: 6379
    depends_on:
      mysql:
        condition: service_healthy  # 等待MySQL就绪
      redis:
        condition: service_healthy  # 等待Redis就绪

  # React 前端
  frontend:
    build: ./frontend
    container_name: todopro-frontend
    ports:
      - "5173:5173"
    environment:
      VITE_API_BASE_URL: http://localhost:8080/api
    depends_on:
      - backend

volumes:
  mysql-   # MySQL数据持久化
  redis-   # Redis数据持久化
```

### 后端 Dockerfile

```dockerfile
# 多阶段构建 - 构建阶段
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# 运行阶段 - 使用更小的JRE镜像
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### 前端 Dockerfile

```dockerfile
# 构建阶段
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 运行阶段 - 使用Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 📦 常用Docker命令

### 服务管理

```bash
# 启动所有服务
docker-compose up -d

# 停止所有服务
docker-compose stop

# 重启所有服务
docker-compose restart

# 停止并删除容器
docker-compose down

# 停止并删除容器+数据卷（⚠️ 会删除数据）
docker-compose down -v
```

### 单个服务操作

```bash
# 启动单个服务
docker-compose up -d backend

# 停止单个服务
docker-compose stop frontend

# 重启单个服务
docker-compose restart mysql

# 查看单个服务日志
docker-compose logs -f backend
```

### 构建相关

```bash
# 重新构建所有镜像
docker-compose build

# 重新构建特定服务
docker-compose build backend

# 强制重新构建（不使用缓存）
docker-compose build --no-cache

# 构建并启动
docker-compose up -d --build
```

### 容器操作

```bash
# 进入后端容器
docker-compose exec backend /bin/bash

# 进入MySQL容器
docker-compose exec mysql /bin/bash

# 进入Redis容器
docker-compose exec redis /bin/sh

# 查看容器状态
docker-compose ps

# 查看容器资源使用
docker stats
```

### 数据库操作

```bash
# 连接MySQL
docker-compose exec mysql mysql -utodopro -ptodopro todopro

# 执行SQL文件
docker-compose exec -T mysql mysql -utodopro -ptodopro todopro < backup.sql

# 备份数据库
docker-compose exec mysql mysqldump -utodopro -ptodopro todopro > backup.sql

# 查看数据库列表
docker-compose exec mysql mysql -utodopro -ptodopro -e "SHOW DATABASES;"
```

### 清理资源

```bash
# 删除停止的容器
docker-compose rm

# 删除未使用的镜像
docker image prune -a

# 删除未使用的卷
docker volume prune

# 清理所有未使用的资源（⚠️ 谨慎使用）
docker system prune -a --volumes
```

## 🐛 常见问题排查

### 问题 1: 端口被占用

**错误**: `bind: address already in use`

**解决**:

```bash
# Windows - 查找占用端口的进程
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :8080
kill -9 <PID>

# 或修改端口
# 编辑docker-compose.yml
ports:
  - "8081:8080"  # 改用8081
```

### 问题 2: MySQL连接失败

**错误**: `Communications link failure`

**解决**:

```bash
# 1. 检查MySQL状态
docker-compose ps mysql

# 2. 查看MySQL日志
docker-compose logs mysql

# 3. 等待健康检查通过
docker-compose ps | grep healthy

# 4. 手动测试连接
docker-compose exec mysql mysqladmin ping -h localhost

# 5. 重启MySQL
docker-compose restart mysql
```

### 问题 3: 后端启动失败

**解决**:

```bash
# 1. 查看详细日志
docker-compose logs backend

# 2. 检查依赖服务
docker-compose ps mysql redis

# 3. 重新构建
docker-compose up -d --build backend

# 4. 查看配置
docker-compose exec backend env | grep SPRING
```

### 问题 4: 前端访问不了后端

**原因**: API地址配置错误

**解决**:

```bash
# 检查前端环境变量
# frontend/Dockerfile 中确认:
ARG VITE_API_BASE_URL=http://localhost:8080/api

# 重新构建前端
docker-compose up -d --build frontend

# 测试后端API
curl http://localhost:8080/api/auth/login
```

### 问题 5: 数据丢失

**原因**: 使用了 `docker-compose down -v`

**预防**:

```bash
# ❌ 不要使用 -v 参数（会删除数据卷）
docker-compose down -v

# ✅ 只删除容器，保留数据
docker-compose down

# 备份数据
docker-compose exec mysql mysqldump -utodopro -ptodopro todopro > backup-$(date +%Y%m%d).sql
```

## 🚀 快速命令速查表

```bash
# ========== 启动/停止 ==========
docker-compose up -d                    # 启动所有服务
docker-compose up -d --build            # 重新构建并启动
docker-compose stop                     # 停止服务
docker-compose restart                  # 重启服务
docker-compose down                     # 停止并删除容器

# ========== 查看状态 ==========
docker-compose ps                       # 查看容器状态
docker-compose logs -f                  # 查看所有日志
docker-compose logs -f backend          # 查看后端日志
docker stats                            # 查看资源使用

# ========== 进入容器 ==========
docker-compose exec backend /bin/bash   # 进入后端
docker-compose exec mysql mysql -utodopro -ptodopro todopro  # 进入MySQL
docker-compose exec redis redis-cli     # 进入Redis

# ========== 数据库操作 ==========
# 备份
docker-compose exec mysql mysqldump -utodopro -ptodopro todopro > backup.sql

# 恢复
docker-compose exec -T mysql mysql -utodopro -ptodopro todopro < backup.sql

# 创建管理员
echo "UPDATE users SET role = 'ADMIN' WHERE username = 'admin';" | docker-compose exec -T mysql mysql -utodopro -ptodopro todopro

# ========== 清理 ==========
docker-compose down                     # 删除容器
docker-compose down -v                  # 删除容器+数据（⚠️ 谨慎）
docker system prune -a                  # 清理所有未使用资源
```

## ✅ 部署完成检查清单

- [ ] Docker和Docker Compose已安装
- [ ] 项目文件完整（docker-compose.yml、Dockerfile等）
- [ ] 执行 `docker-compose up -d`
- [ ] 所有容器状态为 `Up (healthy)`
- [ ] 前端可访问: http://localhost:5173
- [ ] 后端可访问: http://localhost:8080
- [ ] Swagger可访问: http://localhost:8080/swagger-ui.html
- [ ] 已创建管理员账号
- [ ] 已测试登录功能

## 🎉 总结

### Day 12 完成内容

✅ **Docker Compose 配置**

- 4个服务：MySQL + Redis + Backend + Frontend
- 健康检查机制
- 数据持久化
- 服务依赖管理

✅ **Dockerfile 优化**

- 多阶段构建
- 最小化镜像体积
- 使用Alpine基础镜像

✅ **一键部署**

- 单条命令启动所有服务
- 3-5分钟完成部署
- 自动数据库初始化

✅ **完整文档**

- 详细部署步骤
- 常用命令速查
- 问题排查指南

### 下一步

- Day 13: 完善README文档 📝
- 添加架构图和截图 🖼️
- 编写技术亮点总结 ✨

---

**🎊 现在你可以通过`docker-compose up -d`一键部署整个应用了！**
