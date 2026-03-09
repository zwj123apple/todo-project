package com.example.backend.controller;

import com.example.backend.dto.ApiResponse;
import com.example.backend.dto.UserDTO;
import com.example.backend.service.UserService;
import com.example.backend.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    
    private final UserService userService;
    private final JwtUtil jwtUtil;
    
    private Long getUserIdFromToken(String token) {
        String jwt = token.substring(7);
        return jwtUtil.extractUserId(jwt);
    }
    
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDTO>> getCurrentUser(
            @RequestHeader("Authorization") String token) {
        Long userId = getUserIdFromToken(token);
        UserDTO user = userService.getCurrentUser(userId);
        return ResponseEntity.ok(ApiResponse.success(user));
    }
    
    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserDTO>> updateProfile(
            @RequestHeader("Authorization") String token,
            @RequestBody UserDTO userDTO) {
        Long userId = getUserIdFromToken(token);
        UserDTO user = userService.updateProfile(userId, userDTO);
        return ResponseEntity.ok(ApiResponse.success("个人资料更新成功", user));
    }
}