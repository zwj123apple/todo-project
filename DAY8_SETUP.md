# Day 8 文件上传 - 安装和配置说明

## 📦 安装前端依赖

```bash
cd frontend
npm install spark-md5
npm install --save-dev @types/spark-md5
```

## ⚙️ 配置说明

### 后端配置已完成

- ✅ 文件上传目录配置在 `application.yaml`
- ✅ 默认上传目录：`uploads`
- ✅ 分片临时目录：`uploads/chunks`

### 数据库表会自动创建

- `file_metadata` - 文件元数据表
- `chunk_metadata` - 分片元数据表

## 🔧 后端已修复的问题

1. ✅ FileUploadService.java 方法引用语法已修复
2. ✅ application.yaml 文件上传配置已添加

## 🎯 快速测试

### 1. 启动后端

```bash
cd backend
mvn spring-boot:run
```

### 2. 启动前端

```bash
cd frontend
npm install
npm run dev
```

### 3. 测试API

使用Postman或curl测试上传
