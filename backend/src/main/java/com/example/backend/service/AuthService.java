package com.example.backend.service;

import com.example.backend.dto.*;
import com.example.backend.entity.RefreshToken;
import com.example.backend.entity.Tag;
import com.example.backend.entity.User;
import com.example.backend.exception.BadRequestException;
import com.example.backend.exception.UnauthorizedException;
import com.example.backend.repository.RefreshTokenRepository;
import com.example.backend.repository.TagRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {
    
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final TagRepository tagRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("用户名已存在");
        }
        
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("邮箱已被注册");
        }
        
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setNickname(request.getNickname() != null ? request.getNickname() : request.getUsername());
        user.setRole(User.UserRole.USER);
        user.setStatus(User.UserStatus.ACTIVE);
        
        user = userRepository.save(user);
        
        // 为新用户创建默认标签
        createDefaultTagsForUser(user);
        
        String accessToken = jwtUtil.generateAccessToken(user.getUsername(), user.getId(), user.getRole().name());
        String refreshTokenStr = jwtUtil.generateRefreshToken(user.getUsername(), user.getId(), user.getRole().name());
        
        saveRefreshToken(user, refreshTokenStr);
        
        return new AuthResponse(accessToken, refreshTokenStr, UserDTO.fromEntity(user));
    }
    
    /**
     * 为新用户创建默认标签
     */
    private void createDefaultTagsForUser(User user) {
        List<String> defaultTagNames = Arrays.asList("工作", "个人", "学习", "紧急", "重要");
        List<String> defaultTagColors = Arrays.asList("#EF4444", "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6");
        
        for (int i = 0; i < defaultTagNames.size(); i++) {
            Tag tag = new Tag();
            tag.setName(defaultTagNames.get(i));
            tag.setColor(defaultTagColors.get(i));
            tag.setUser(user);
            tag.setCreatedAt(LocalDateTime.now());
            tagRepository.save(tag);
        }
    }
    
    @Transactional
    public AuthResponse login(AuthRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsernameOrEmail(),
                        request.getPassword()
                )
        );
        
        User user = userRepository.findByUsernameOrEmail(
                        request.getUsernameOrEmail(),
                        request.getUsernameOrEmail())
                .orElseThrow(() -> new UnauthorizedException("用户不存在"));
        
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);
        
        String accessToken = jwtUtil.generateAccessToken(user.getUsername(), user.getId(), user.getRole().name());
        String refreshTokenStr = jwtUtil.generateRefreshToken(user.getUsername(), user.getId(), user.getRole().name());
        
        refreshTokenRepository.deleteByUserId(user.getId());
        saveRefreshToken(user, refreshTokenStr);
        
        return new AuthResponse(accessToken, refreshTokenStr, UserDTO.fromEntity(user));
    }
    
    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String requestRefreshToken = request.getRefreshToken();
        
        RefreshToken refreshToken = refreshTokenRepository.findByToken(requestRefreshToken)
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));
        
        if (refreshToken.isExpired()) {
            refreshTokenRepository.delete(refreshToken);
            throw new UnauthorizedException("Refresh token已过期");
        }
        
        User user = refreshToken.getUser();
        
        String newAccessToken = jwtUtil.generateAccessToken(user.getUsername(), user.getId(), user.getRole().name());
        String newRefreshToken = jwtUtil.generateRefreshToken(user.getUsername(), user.getId(), user.getRole().name());
        
        refreshTokenRepository.delete(refreshToken);
        saveRefreshToken(user, newRefreshToken);
        
        return new AuthResponse(newAccessToken, newRefreshToken, UserDTO.fromEntity(user));
    }
    
    private void saveRefreshToken(User user, String token) {
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setToken(token);
        refreshToken.setUser(user);
        refreshToken.setExpiryDate(LocalDateTime.now().plusDays(7));
        refreshToken.setCreatedAt(LocalDateTime.now());
        refreshTokenRepository.save(refreshToken);
    }
}