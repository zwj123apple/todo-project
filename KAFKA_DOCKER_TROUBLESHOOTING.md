# Kafka Docker 故障排除指南

## ❌ 错误: Docker Engine未运行

### 错误信息

```
error during connect: Get "http://%2F%2F.%2Fpipe%2Fdocker_engine/v1.47/...":
open //./pipe/docker_engine: The system cannot find the file specified.
```

### 解决方案

#### 方案1: 启动Docker Desktop（推荐）

1. **打开Docker Desktop**
   - 在Windows开始菜单搜索 "Docker Desktop"
   - 点击启动
   - 等待Docker图标变为绿色（运行中）

2. **验证Docker是否运行**

   ```bash
   docker version
   docker ps
   ```

3. **重新启动Kafka服务**
   ```bash
   docker-compose up -d zookeeper kafka kafka-ui
   ```

#### 方案2: 以管理员身份运行PowerShell

1. **右键点击PowerShell图标**
2. **选择"以管理员身份运行"**
3. **重新执行命令**
   ```bash
   cd C:\full-stack\todo-project
   docker-compose up -d zookeeper kafka kafka-ui
   ```

#### 方案3: 检查Docker Desktop设置

1. **打开Docker Desktop**
2. **点击设置图标（齿轮）**
3. **进入 General 设置**
4. **确保以下选项已启用：**
   - ✅ Start Docker Desktop when you log in
   - ✅ Use the WSL 2 based engine

5. **点击"Apply & Restart"**

---

## ✅ 简化启动方案（无需Kafka UI）

如果Kafka UI下载失败，可以不使用它，仅启动核心服务：

### 修改docker-compose.yml

暂时注释掉kafka-ui服务：

```yaml
# services下面，注释掉kafka-ui部分
# kafka-ui:
#   image: provectuslabs/kafka-ui:latest
#   ...
```

### 启动核心服务

```bash
# 只启动Zookeeper和Kafka
docker-compose up -d zookeeper kafka
```

### 验证服务状态

```bash
# 查看服务状态
docker-compose ps

# 应该看到zookeeper和kafka都是Up状态
```

### 使用命令行查看Kafka

```bash
# 列出所有Topic
docker exec -it todopro-kafka kafka-topics --bootstrap-server localhost:9092 --list

# 查看Topic详情
docker exec -it todopro-kafka kafka-topics \
    --bootstrap-server localhost:9092 \
    --describe --topic task-created-topic

# 查看消费者组
docker exec -it todopro-kafka kafka-consumer-groups \
    --bootstrap-server localhost:9092 \
    --list
```

---

## 🔧 完整启动步骤（从零开始）

### Step 1: 确认Docker运行

```bash
# 检查Docker版本
docker version

# 如果失败，启动Docker Desktop
```

### Step 2: 清理旧容器（可选）

```bash
# 停止并删除所有相关容器
docker-compose down -v

# 删除旧镜像（可选）
docker image prune -a
```

### Step 3: 启动服务

```bash
# 方式A: 启动所有服务（包括Kafka UI）
docker-compose up -d

# 方式B: 只启动核心服务（不包括Kafka UI）
docker-compose up -d zookeeper kafka mysql redis

# 方式C: 分步启动，查看日志
docker-compose up zookeeper kafka
```

### Step 4: 验证服务

```bash
# 查看所有容器状态
docker-compose ps

# 查看Kafka日志
docker logs todopro-kafka

# 查看Zookeeper日志
docker logs todopro-zookeeper
```

### Step 5: 启动后端

```bash
cd backend
mvn spring-boot:run
```

---

## 🐛 常见问题

### 问题1: 端口被占用

**错误信息:**

```
Error: port 9092 is already allocated
```

**解决方案:**

```bash
# 查看占用端口的进程
netstat -ano | findstr :9092

# 停止占用的容器
docker stop $(docker ps -q)

# 或修改docker-compose.yml中的端口映射
ports:
  - "19092:9092"  # 改用19092端口
```

### 问题2: 容器启动失败

**检查步骤:**

```bash
# 1. 查看详细日志
docker-compose logs kafka

# 2. 检查Zookeeper是否正常
docker-compose logs zookeeper

# 3. 重新创建容器
docker-compose down
docker-compose up -d
```

### 问题3: 连接被拒绝

**错误信息:**

```
Connection refused: localhost:9092
```

**解决方案:**

```bash
# 1. 检查Kafka健康状态
docker exec -it todopro-kafka kafka-broker-api-versions \
    --bootstrap-server localhost:9092

# 2. 检查防火墙设置
# 3. 使用docker内部网络地址: kafka:9092
```

---

## 📝 推荐配置

### 最小化配置（快速测试）

创建 `docker-compose-minimal.yml`:

```yaml
services:
  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    container_name: todopro-zookeeper
    ports:
      - "2181:2181"
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000

  kafka:
    image: confluentinc/cp-kafka:7.5.0
    container_name: todopro-kafka
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
      - "9093:9093"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092,PLAINTEXT_HOST://localhost:9093
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT
      KAFKA_INTER_BROKER_LISTENER_NAME: PLAINTEXT
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
```

使用方式:

```bash
docker-compose -f docker-compose-minimal.yml up -d
```

---

## ✅ 验证清单

启动成功后，依次检查：

- [ ] Docker Desktop 正在运行（绿色图标）
- [ ] `docker ps` 显示zookeeper和kafka容器
- [ ] `docker logs todopro-kafka` 无ERROR日志
- [ ] 后端应用成功连接Kafka
- [ ] 测试接口可以发送消息
- [ ] 后端日志显示消费者接收消息

---

## 🆘 仍然无法解决？

### 方案A: 使用本地Kafka（不使用Docker）

下载并解压Kafka:

1. 访问 https://kafka.apache.org/downloads
2. 下载最新版本
3. 解压并启动

```bash
# 启动Zookeeper
bin\windows\zookeeper-server-start.bat config\zookeeper.properties

# 新窗口启动Kafka
bin\windows\kafka-server-start.bat config\server.properties
```

### 方案B: 使用云服务

使用云端Kafka服务（如Confluent Cloud）进行学习和测试。

### 方案C: 使用WSL2

在WSL2 Ubuntu中安装Docker:

```bash
# 在WSL2中
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo service docker start
```

---

## 📞 获取帮助

如果以上方案都无法解决问题：

1. 检查Docker官方文档：https://docs.docker.com/
2. 查看项目issue或提交新issue
3. 检查Windows版本和Docker兼容性

**Good Luck! 🍀**
