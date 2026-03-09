package com.example.backend.security;

import com.example.backend.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

/**
 * SSE 认证过滤器 - 处理通过URL参数传递token的SSE连接
 * 🎯 性能优化：SSE长连接直接从token构建UserDetails，不查询数据库
 */
@Component
@RequiredArgsConstructor
public class SseAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        // 只处理 SSE 端点
        if (!request.getRequestURI().contains("/api/notifications/stream")) {
            filterChain.doFilter(request, response);
            return;
        }

        // 从URL参数获取token
        String token = request.getParameter("token");
        
        if (token != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                // 从token中提取用户信息
                String username = jwtUtil.extractUsername(token);
                String role = jwtUtil.extractRole(token);
                
                if (username != null && jwtUtil.validateToken(token, username)) {
                    // 🎯 关键优化：直接从token构建UserDetails，不查询数据库
                    // SSE是长连接，不需要每次心跳都获取最新用户状态
                    UserDetails userDetails = User.builder()
                            .username(username)
                            .password("") // 密码不需要，因为已经通过JWT验证
                            .authorities(Collections.singletonList(
                                    new SimpleGrantedAuthority("ROLE_" + role)
                            ))
                            .build();
                    
                    UsernamePasswordAuthenticationToken authentication = 
                        new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities()
                        );
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            } catch (Exception e) {
                logger.error("SSE认证失败: " + e.getMessage());
            }
        }
        
        filterChain.doFilter(request, response);
    }
}
