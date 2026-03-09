package com.example.backend.security;

import java.io.IOException;

import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.ExpiredJwtException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

//处理 401
@Component
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

 @Override
 public void commence(HttpServletRequest request,
                      HttpServletResponse response,
                      AuthenticationException authException) throws IOException {
     response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
     response.setContentType("application/json;charset=UTF-8");
     
     // 可以根据异常类型返回不同 message
     String message = "认证失败，请重新登录";
     if (authException.getCause() instanceof ExpiredJwtException) {
         message = "登录已过期，请重新登录";
     }
     
     response.getWriter().write(String.format(
         "{\"code\": 401, \"message\": \"%s\"}", message
     ));
 }
}