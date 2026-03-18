# Spring Security & JWT 面试宝典 🔐

## 📚 核心知识点

### Q1: JWT认证流程完整解析

**答案**:

#### 认证流程图

```
登录 → 验证 → 生成Token → 返回Token
          ↓
客户端存储 → 请求带Token → 验证Token → 返回数据
```

#### JWT结构

```
Header.Payload.Signature

Header:  {"alg": "HS256", "typ": "JWT"}
Payload: {"sub": "username", "userId": 123, "exp": 1234567890}
Signature: HMACSHA256(base64(header) + "." + base64(payload), secret)
```

#### 项目实现

```java
// 1. 生成Token
@Component
public class JwtUtil {
    @Value("${jwt.secret}")
    private String secret;

    public String generateToken(String username, Long userId) {
        return Jwts.builder()
            .claim("userId", userId)
            .setSubject(username)
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + 86400000))
            .signWith(SignatureAlgorithm.HS512, secret)
            .compact();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser().setSigningKey(secret).parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}

// 2. JWT过滤器
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) {
        String token = request.getHeader("Authorization");
        if (token != null && token.startsWith("Bearer ")) {
            String jwt = token.substring(7);
            // 验证并设置认证信息
        }
        filterChain.doFilter(request, response);
    }
}
```

---

### Q2: RBAC权限控制实现

**答案**:

#### 数据模型

```sql
user (id, username, role)  -- USER, ADMIN
```

#### 代码实现

```java
// 1. User实体实现UserDetails
@Entity
public class User implements UserDetails {
    @Enumerated(EnumType.STRING)
    private UserRole role;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }
}

// 2. 权限控制
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/users")
    public List<UserDTO> getAllUsers() {
        // 只有ADMIN可以访问
    }
}

// 3. Security配置
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) {
        http.authorizeHttpRequests(auth -> auth
            .requestMatchers("/api/auth/**").permitAll()
            .requestMatchers("/api/admin/**").hasRole("ADMIN")
            .anyRequest().authenticated()
        );
        return http.build();
    }
}
```

---

### Q3: Session vs JWT对比

**答案**:

| 特性         | Session               | JWT           |
| ------------ | --------------------- | ------------- |
| **存储位置** | 服务器                | 客户端        |
| **扩展性**   | 差（需要session共享） | 好（无状态）  |
| **安全性**   | 高（服务器控制）      | 中（需防XSS） |
| **性能**     | 需查询session         | 直接验证      |
| **适用场景** | 单体应用              | 微服务/分布式 |

**JWT优势**:

- ✅ 无状态，易扩展
- ✅ 跨域友好
- ✅ 适合移动端

**JWT劣势**:

- ❌ Token泄露难撤销
- ❌ Token体积大
- ❌ 无法主动失效

---

### Q4: Token刷新机制

**答案**:

#### 双Token机制

```java
public class AuthResponse {
    private String accessToken;   // 短期（30分钟）
    private String refreshToken;  // 长期（7天）
}

// 刷新Token接口
@PostMapping("/refresh")
public AuthResponse refreshToken(@RequestBody RefreshTokenRequest request) {
    // 1. 验证refreshToken
    if (!jwtUtil.validateToken(request.getRefreshToken())) {
        throw new UnauthorizedException("Invalid refresh token");
    }

    // 2. 生成新的accessToken
    String username = jwtUtil.extractUsername(request.getRefreshToken());
    String newAccessToken = jwtUtil.generateAccessToken(username);

    return new AuthResponse(newAccessToken, request.getRefreshToken());
}
```

---

### Q5: 常见安全问题

**1. XSS攻击防御**

```javascript
// ❌ 不要用innerHTML
element.innerHTML = userInput;

// ✅ 使用textContent或React自动转义
element.textContent = userInput;
<div>{userInput}</div>; // React自动转义
```

**2. CSRF攻击防御**

```java
// JWT天然防CSRF（不使用Cookie）
// 如果使用Cookie存储Token，需要：
http.csrf().csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse());
```

**3. SQL注入防御**

```java
// ❌ 字符串拼接
String sql = "SELECT * FROM user WHERE username = '" + username + "'";

// ✅ 使用参数化查询
@Query("SELECT u FROM User u WHERE u.username = :username")
User findByUsername(@Param("username") String username);
```

---

## 🎯 高频面试题

### 1. JWT的secret泄露怎么办？

**答:**

- 立即更换secret
- 所有用户重新登录
- 使用非对称加密（RS256）更安全

### 2. 如何实现单点登录（SSO）？

**答:**

- 使用统一认证中心
- 各系统共享Token
- 或使用OAuth2.0

### 3. 前端如何存储Token？

**答:**

```javascript
// 方案1: localStorage（常用）
localStorage.setItem("token", token);

// 方案2: sessionStorage（关闭标签页失效）
sessionStorage.setItem("token", token);

// 方案3: httpOnly Cookie（最安全，防XSS）
// 后端设置：response.addCookie(cookie);
```

### 4. Token过期前端如何处理？

**答:**

```typescript
// axios拦截器自动刷新
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token过期，尝试刷新
      const newToken = await refreshToken();
      error.config.headers.Authorization = `Bearer ${newToken}`;
      return axios(error.config);
    }
    return Promise.reject(error);
  },
);
```

### 5. 如何防止Token被盗用？

**答:**

- HTTPS传输
- Token设置短过期时间
- 绑定IP地址或设备信息
- 异常登录检测

---

**Good Luck! 🚀**
