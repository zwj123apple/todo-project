# Java Spring Boot 面试题宝典 ☕

## 📚 目录

1. [核心概念](#核心概念)
2. [常用注解](#常用注解)
3. [Bean管理](#bean管理)
4. [AOP编程](#aop编程)
5. [事务管理](#事务管理)
6. [高频面试题](#高频面试题)

---

## 🎯 核心概念

### Q1: 什么是Spring Boot？它解决了什么问题？

**答案**:

Spring Boot是Spring框架的扩展，旨在简化Spring应用的搭建和开发过程。

**核心特性**:

1. **自动配置**: 根据classpath自动配置Bean
2. **起步依赖**: 简化Maven/Gradle配置
3. **内嵌服务器**: 无需部署WAR包
4. **生产就绪**: 提供监控、健康检查等功能

**解决的问题**:

- ❌ 传统Spring配置繁琐（大量XML）
- ❌ 依赖管理复杂
- ❌ 部署困难
- ✅ Spring Boot零配置快速开发

**项目实例**:

```java
@SpringBootApplication  // 一个注解启动整个应用
public class BackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }
}
```

---

## 🏷️ 常用注解

### Q2: 解释@RestController和@Controller的区别

**答案**:

| 特性         | @Controller       | @RestController             |
| ------------ | ----------------- | --------------------------- |
| **组成**     | 单独注解          | @Controller + @ResponseBody |
| **返回值**   | 视图名称（HTML）  | JSON/XML数据                |
| **应用场景** | MVC架构，返回页面 | REST API，返回数据          |

**代码对比**:

```java
// @Controller - 需要额外加@ResponseBody
@Controller
public class TaskController {
    @GetMapping("/tasks")
    @ResponseBody  // 每个方法都要加
    public List<Task> getTasks() {
        return taskService.findAll();
    }
}

// @RestController - 自动返回JSON
@RestController
@RequestMapping("/api/tasks")
public class TaskController {
    @GetMapping  // 自动转JSON，无需@ResponseBody
    public ResponseEntity<List<TaskDTO>> getTasks() {
        return ResponseEntity.ok(taskService.findAll());
    }
}
```

**面试加分**:

- 提到RESTful API设计原则
- 说明@ResponseBody的作用（HttpMessageConverter）

---

### Q3: @Autowired vs @Resource vs 构造函数注入

**答案**:

#### 三种注入方式对比

**1. @Autowired (Spring注解，按类型注入)**

```java
@Service
public class TaskService {
    @Autowired  // 字段注入 - 不推荐
    private TaskRepository taskRepository;
}
```

**2. @Resource (JDK注解，按名称注入)**

```java
@Service
public class TaskService {
    @Resource(name = "taskRepository")  // 按bean名称注入
    private TaskRepository taskRepository;
}
```

**3. 构造函数注入 (推荐✅)**

```java
@Service
@RequiredArgsConstructor  // Lombok自动生成构造函数
public class TaskService {
    private final TaskRepository taskRepository;  // final保证不可变
    private final UserRepository userRepository;

    // 自动生成构造函数，Spring自动注入
}
```

**为什么推荐构造函数注入**:

1. ✅ **不可变性**: final字段，线程安全
2. ✅ **易于测试**: 可以直接new对象
3. ✅ **避免循环依赖**: 编译时就能发现问题
4. ✅ **明确依赖**: 一眼看出所有依赖

**面试加分点**:

```java
// 循环依赖示例（字段注入可能隐藏问题）
@Service
public class A {
    @Autowired
    private B b;  // A依赖B
}

@Service
public class B {
    @Autowired
    private A a;  // B依赖A - 运行时才报错
}

// 构造函数注入会在编译时报错
@Service
@RequiredArgsConstructor
public class A {
    private final B b;  // 编译器检测到循环依赖
}
```

---

## 🔄 Bean管理

### Q4: Spring Bean的生命周期（详细版）

**答案**:

#### 完整生命周期流程

```
1. 实例化 (Instantiation)
   ↓
2. 属性赋值 (Populate Properties)
   ↓
3. Aware接口回调
   ├─ BeanNameAware.setBeanName()
   ├─ BeanFactoryAware.setBeanFactory()
   └─ ApplicationContextAware.setApplicationContext()
   ↓
4. BeanPostProcessor.postProcessBeforeInitialization()
   ↓
5. InitializingBean.afterPropertiesSet()
   ↓
6. 自定义init方法 (@PostConstruct)
   ↓
7. BeanPostProcessor.postProcessAfterInitialization()
   ↓
8. Bean可用 (Ready for use)
   ↓
9. DisposableBean.destroy()
   ↓
10. 自定义destroy方法 (@PreDestroy)
```

#### 代码演示

```java
@Component
public class LifecycleBean implements
        BeanNameAware,
        ApplicationContextAware,
        InitializingBean,
        DisposableBean {

    private String beanName;
    private ApplicationContext context;

    // 1. 构造函数
    public LifecycleBean() {
        System.out.println("1. 构造函数执行");
    }

    // 2. 属性注入后
    @Autowired
    public void setDependency(SomeDependency dep) {
        System.out.println("2. 属性注入完成");
    }

    // 3. Aware接口回调
    @Override
    public void setBeanName(String name) {
        this.beanName = name;
        System.out.println("3. BeanNameAware: " + name);
    }

    @Override
    public void setApplicationContext(ApplicationContext ctx) {
        this.context = ctx;
        System.out.println("4. ApplicationContextAware");
    }

    // 5. 初始化方法
    @PostConstruct
    public void postConstruct() {
        System.out.println("5. @PostConstruct执行");
    }

    @Override
    public void afterPropertiesSet() {
        System.out.println("6. InitializingBean.afterPropertiesSet()");
    }

    // 7. Bean可用
    public void doSomething() {
        System.out.println("7. Bean正在使用中");
    }

    // 8. 销毁方法
    @PreDestroy
    public void preDestroy() {
        System.out.println("8. @PreDestroy执行");
    }

    @Override
    public void destroy() {
        System.out.println("9. DisposableBean.destroy()");
    }
}
```

**面试加分**:

- 提到BeanPostProcessor可以对所有Bean进行统一处理
- 说
