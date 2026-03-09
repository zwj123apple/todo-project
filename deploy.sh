@echo off
REM TodoPro 项目一键部署脚本 (Windows)
REM 使用方法: deploy.bat

echo ========================================
echo 🚀 TodoPro 项目一键部署
echo ========================================
echo.

REM 检查Docker是否运行
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker 未运行，请启动 Docker Desktop
    pause
    exit /b 1
)

echo ✅ Docker 正在运行
echo.

REM 停止现有容器
echo 📦 停止现有容器...
docker-compose down

REM 启动所有服务
echo 🔨 构建并启动所有服务...
docker-compose up -d --build

REM 等待服务启动
echo ⏳ 等待服务启动...
timeout /t 10 /nobreak >nul

REM 检查服务状态
echo.
echo 📊 服务状态：
docker-compose ps

echo.
echo ========================================
echo 🎉 部署完成！
echo ========================================
echo.
echo 📱 访问地址：
echo   前端: http://localhost:5173
echo   后端: http://localhost:8080
echo   Swagger: http://localhost:8080/swagger-ui.html
echo.
echo 📝 创建管理员账号：
echo   docker-compose exec mysql mysql -utodopro -ptodopro todopro
echo   UPDATE users SET role = 'ADMIN' WHERE username = 'your_username';
echo.
echo 📋 查看日志：
echo   docker-compose logs -f
echo.
pause