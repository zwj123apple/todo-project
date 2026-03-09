package com.example.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AuthRequest {
    
    @NotBlank(message = "用户名或邮箱不能为空")
    private String usernameOrEmail;
    
    @NotBlank(message = "密码不能为空")
    private String password;
}