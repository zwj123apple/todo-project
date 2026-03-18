# React + Java 全栈面试题宝典 🎯

## 📚 目录

1. [Java Spring Boot 核心](#java-spring-boot-核心)
2. [Spring Security & JWT](#spring-security--jwt)
3. [JPA & MyBatis](#jpa--mybatis)
4. [React & TypeScript](#react--typescript)
5. [状态管理](#状态管理)
6. [数据库设计](#数据库设计)
7. [Redis缓存](#redis缓存)
8. [Kafka消息队列](#kafka消息队列)
9. [微服务架构](#微服务架构)
10. [性能优化](#性能优化)
11. [项目经验](#项目经验)

---

## 🔥 Java Spring Boot 核心

### Q1: 解释Spring Boot的核心注解及其作用

**标准答案：**

#### 1. @SpringBootApplication

- **组成**: `@Configuration` + `@EnableAutoConfiguration` + `@ComponentScan`
- **作用**: 标识主启动类，启用自动配置

```java
@SpringBootApplication
public class BackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }
}
```

#### 2. @RestController

- **组成**: `@Controller` + `@ResponseBody`
- **作用**: 标识REST API控制器，自动将返回值序列化为JSON

```java
@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor  // Lombok注解，生成构造函数
public class TaskController {
    private final TaskService taskService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TaskDTO>>> getAllTasks() {
        // ...
    }
}
```

#### 3. @Service、@Repository、@Component

- **作用**: 标识不同层的Bean
- **@Service**: 业务逻辑层
- **@Repository**: 数据访问层
- **@Component**: 通用组件

```java
@Service
@RequiredArgsConstructor
public class TaskService {
    private final TaskRepository taskRepository;

    @Transactional  // 事务管理
    public TaskDTO createTask(Long userId, TaskRequest request) {
        // 业务逻辑
    }
}
```

#### 4. @Autowired vs @RequiredArgsConstructor

**不推荐（字段注入）:**

```java
@Autowired
private TaskService taskService;  // 难以测试，容易产生循环依赖
```

**推荐（构造函数注入）:**

```java
@RequiredArgsConstructor  // Lombok生成构造函数
public class TaskController {
    private final TaskService taskService;  // 更好的封装性，易于测试
}
```

**面试加分点：**

- 构造函数注入优于字段注入
- final字段保证不可变性
- 便于单元测试（可以new对象）

---

### Q2: Spring Bean的生命周期

**标准答案：**

#### Bean生命周期流程

```
实例化 → 属性赋值 → 初始化 → 使用 → 销毁
```

#### 详细步骤：

1. **实例化**: `createBeanInstance()`
2. **属性注入**: `populateBean()` - 依赖注入
3. **Aware接口回调**:
   - BeanNameAware
   - BeanFactoryAware
   - ApplicationContextAware
4. **BeanPostProcessor前置处理**: `postProcessBeforeInitialization()`
5. **InitializingBean**: `afterPropertiesSet()`
6. **自定义init方法**: `@PostConstruct`
7. **BeanPostProcessor后置处理**: `postProcessAfterInitialization()`
8. **Bean使用**
9. **DisposableBean**: `destroy()`
10. **自定义destroy方法**: `@PreDestroy`

#### 代码示例：

```java
@Component
public class MyBean {

    @PostConstruct
    public void init() {
        System.out.println("Bean初始化");
    }

    @PreDestroy
    public void destroy() {
        System.out.println("Bean销毁");
    }
}
```

---

### Q3: Spring AOP的实现原理

**标准答案：**

#### AOP核心概念

- **切面(Aspect)**: 横切关注点的模块化
- **连接点(JoinPoint)**: 程序执行的某个点（方法调用）
- **切点(Pointcut)**: 匹配连接点的表达式
- **通知(Advice)**: 在切点执行的代码
- **织入(Weaving)**: 将切面应用到目标对象

#### 实现原理

Spring AOP基于**动态代理**:

1. **JDK动态代理**: 目标对象实现了接口
2. **CGLIB代理**: 目标对象没有实现接口

#### 项目实际应用：全局异常处理

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleResourceNotFound(
            ResourceNotFoundException ex) {
        return ResponseEntity
            .status(HttpStatus.NOT_FOUND)
            .body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ApiResponse<Void>> handleUnauthorized(
            UnauthorizedException ex) {
        return ResponseEntity
            .status(HttpStatus.UNAUTHORIZED)
            .body(ApiResponse.error(ex.getMessage()));
    }
}
```

#### 自定义切面示例：

```java
@Aspect
@Component
public class LoggingAspect {

    @Around("@annotation(org.springframework.web.bind.annotation.GetMapping)")
    public Object logExecutionTime(ProceedingJoinPoint joinPoint) throws Throwable {
        long start = System.currentTimeMillis();

        Object result = joinPoint.proceed();  // 执行目标方法

        long executionTime = System.currentTimeMillis() - start;
        System.out.println(joinPoint.getSignature() + " executed in " + executionTime + "ms");

        return result;
    }
}
```

**面试加分点：**

- 解释@Around、@Before、@After的区别
- 说明JDK代理和CGLIB代理的区别
- 提到@Transactional就是基于AOP实现的

---

## 🔐 Spring Security & JWT

### Q4: JWT认证流程

**标准答案：**

#### JWT认证流程图

```
1. 用户登录 → 2. 验证用户名密码 → 3. 生成JWT Token
              ↓
4. 返回Token → 5. 客户端保存Token → 6. 请求时携带Token
              ↓
7. 服务器验证Token → 8. 返回数据
```

#### JWT Token结构

```
Header.Payload.Signature

Header:  {"alg": "HS256", "typ": "JWT"}
Payload: {"sub": "username", "exp": 1234567890}
Signature: HMACSHA256(base64(header) + "." + base64(payload), secret)
```

#### 项目实现代码：

**1. JWT工具类**

```java
@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private Long expiration;

    // 生成Token
    public String generateToken(String username, Long userId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(username)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(SignatureAlgorithm.HS512, secret)
                .compact();
    }

    // 验证Token
    public boolean validateToken(String token) {
        try {
            Jwts.parser().setSigningKey(secret).parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    // 从Token提取用户名
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }
}
```

**2. JWT过滤器**

```java
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        // 1. 从请求头获取Token
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String jwt = authHeader.substring(7);
        String username = jwtUtil.extractUsername(jwt);

        // 2. 验证Token并设置认证信息
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

            if (jwtUtil.validateToken(jwt)) {
                UsernamePasswordAuthenticationToken authToken =
                    new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        filterChain.doFilter(request, response);
    }
}
```

**3. Security配置**

```java
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()  // 登录注册不需要认证
                .requestMatchers("/api/admin/**").hasRole("ADMIN")  // 管理员接口
                .anyRequest().authenticated()  // 其他接口需要认证
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)  // 无状态
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
```

**面试加分点：**

- Token存储位置：localStorage vs sessionStorage vs httpOnly Cookie
- Token刷新机制：Refresh Token的作用
- 安全问题：XSS、CSRF攻击防御

---

### Q5: RBAC权限控制如何实现？

**标准答案：**

#### RBAC（Role-Based Access Control）模型

```
用户(User) → 角色(Role) → 权限(Permission) → 资源(Resource)
```

#### 数据库设计

```sql
-- 用户表
CREATE TABLE user (
    id BIGINT PRIMARY KEY,
    username VARCHAR(50),
    password VARCHAR(255),
    role ENUM('USER', 'ADMIN'),  -- 简化版：直接在用户表存角色
    status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED')
);

-- 完整版：多对多关系
CREATE TABLE role (
    id BIGINT PRIMARY KEY,
    name VARCHAR(50)
);

CREATE TABLE permission (
    id BIGINT PRIMARY KEY,
    name VARCHAR(50),
    resource VARCHAR(100),
    action VARCHAR(50)
);

CREATE TABLE user_role (
    user_id BIGINT,
    role_id BIGINT
);

CREATE TABLE role_permission (
    role_id BIGINT,
    permission_id BIGINT
);
```

#### 代码实现

**1. 用户实体**

```java
@Entity
@Table(name = "user")
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;
    private String password;

    @Enumerated(EnumType.STRING)
    private UserRole role;  // USER, ADMIN

    @Enumerated(EnumType.STRING)
    private UserStatus status;  // ACTIVE, INACTIVE, SUSPENDED

    // 实现UserDetails接口
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public boolean isAccountNonLocked() {
        return status == UserStatus.ACTIVE;
    }
}
```

**2. 权限注解使用**

```java
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    // 方法级权限控制
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/users")
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        // 只有ADMIN角色可以访问
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @PutMapping("/users/{id}")
    public ResponseEntity<UserDTO> updateUser(@PathVariable Long id) {
        // ADMIN或MANAGER都可以访问
    }

    @PreAuthorize("@userService.isOwner(#userId,
```
