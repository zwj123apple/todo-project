# Todo Project - 全栈待办事项应用

这是一个使用Spring Boot + React + TypeScript构建的全栈待办事项管理应用。

## 技术栈

### 后端

- Java 17
- Spring Boot 3.5.11
- Spring Security + JWT
- Spring Data JPA
- MySQL 8.0
- Redis 7
- Maven

### 前端

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Zustand (状态管理)
- Axios

### 部署

- Docker & Docker Compose
- Nginx

## 功能特性

- ✅ 用户注册和登录
- ✅ JWT Token认证
- ✅ Token自动刷新
- ✅ 任务CRUD操作
- ✅ 任务状态管理 (TODO, IN_PROGRESS, DONE, CANCELLED)
- ✅ 任务优先级 (LOW, MEDIUM, HIGH, URGENT)
- ✅ 标签管理
- ✅ 用户资料管理
- ✅ 全局异常处理
- ✅ 跨域支持

## 项目结构

```
todo-project/
├── backend/                 # Spring Boot后端
│   ├── src/main/java/
│   │   └── com/example/backend/
│   │       ├── config/      # 配置类
│   │       ├── controller/  # REST控制器
│   │       ├── dto/         # 数据传输对象
│   │       ├── entity/      # JPA实体类
│   │       ├── exception/   # 异常处理
│   │       ├── repository/  # 数据访问层
│   │       ├── security/    # 安全配置
│   │       ├── service/     # 业务逻辑层
│   │       └── util/        # 工具类
│   ├── src/main/resources/
│   │   └── application.yaml # 应用配置
│   ├── Dockerfile
│   └── pom.xml
├── frontend/                # React前端
│   ├── src/
│   │   ├── components/      # React组件
│   │   ├── config/          # 前端配置
│   │   ├── lib/             # 工具库
│   │   ├── services/        # API服务
│   │   ├── stores/          # 状态管理
│   │   ├── types/           # TypeScript类型
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml       # Docker编排配置
└── README.md

```

## API端点

### 认证

- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/refresh` - 刷新Token

### 任务

- `GET /api/tasks` - 获取所有任务
- `GET /api/tasks/status/{status}` - 按状态获取任务
- `GET /api/tasks/{id}` - 获取单个任务
- `POST /api/tasks` - 创建任务
- `PUT /api/tasks/{id}` - 更新任务
- `DELETE /api/tasks/{id}` - 删除任务

### 标签

- `GET /api/tags` - 获取所有标签
- `GET /api/tags/{id}` - 获取单个标签
- `POST /api/tags` - 创建标签
- `PUT /api/tags/{id}` - 更新标签
- `DELETE /api/tags/{id}` - 删除标签

### 用户

- `GET /api/users/me` - 获取当前用户信息
- `PUT /api/users/me` - 更新用户资料

## 快速开始

### 前提条件

- Docker 和 Docker Compose
- Node.js 20+ (本地开发)
- Java 17+ (本地开发)
- Maven 3.9+ (本地开发)

### 使用Docker Compose运行

1. 克隆项目

```bash
git clone <repository-url>
cd todo-project
```

2. 启动所有服务

```bash
docker-compose up -d
```

3. 访问应用

- 前端: http://localhost:5173
- 后端API: http://localhost:8080/api
- MySQL: localhost:3306
- Redis: localhost:6379

4. 停止服务

```bash
docker-compose down
```

### 本地开发

#### 后端开发

1. 启动MySQL和Redis

```bash
docker-compose up -d mysql redis
```

2. 运行Spring Boot应用

```bash
cd backend
mvn spring-boot:run
```

#### 前端开发

1. 安装依赖

```bash
cd frontend
npm install
```

2. 启动开发服务器

```bash
npm run dev
```

3. 访问 http://localhost:5173

## 配置说明

### 后端配置 (application.yaml)

- 数据库连接
- Redis配置
- JWT密钥和过期时间
- 日志级别

### 前端配置 (config/index.ts)

- API基础URL
- 路由配置
- 存储键
- 查询键

## 环境变量

### 后端

- `SPRING_DATASOURCE_URL` - 数据库URL
- `SPRING_DATASOURCE_USERNAME` - 数据库用户名
- `SPRING_DATASOURCE_PASSWORD` - 数据库密码
- `SPRING_REDIS_HOST` - Redis主机
- `SPRING_REDIS_PORT` - Redis端口

### 前端

- `VITE_API_BASE_URL` - 后端API地址

## 安全性

- 密码使用BCrypt加密
- JWT Token认证
- Refresh Token机制
- CORS配置
- 请求验证

## 许可证

MIT

## 贡献

欢迎提交Issue和Pull Request！
