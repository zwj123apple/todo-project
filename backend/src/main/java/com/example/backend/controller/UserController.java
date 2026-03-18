package com.example.backend.controller;

import com.example.backend.dto.ApiResponse;
import com.example.backend.dto.UserDTO;
import com.example.backend.entity.User;
import com.example.backend.exception.UnauthorizedException;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    
    private final UserService userService;
    private final UserRepository userRepository;
    
    private User getCurrentUser(Authentication authentication) {
        String username = authentication.getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UnauthorizedException("用户不存在"));
    }
    
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDTO>> getCurrentUser(Authentication authentication) {
        User user = getCurrentUser(authentication);
        UserDTO userDTO = userService.getCurrentUser(user.getId());
        return ResponseEntity.ok(ApiResponse.success(userDTO));
    }
    
    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserDTO>> updateProfile(
            Authentication authentication,
            @RequestBody UserDTO userDTO) {
        User user = getCurrentUser(authentication);
        UserDTO updatedUser = userService.updateProfile(user.getId(), userDTO);
        return ResponseEntity.ok(ApiResponse.success("个人资料更新成功", updatedUser));
    }
}
