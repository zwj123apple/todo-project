# 使用Maven构建
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# 复制Maven配置文件（使用阿里云镜像）
COPY settings.xml /root/.m2/settings.xml

COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# 运行阶段
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]