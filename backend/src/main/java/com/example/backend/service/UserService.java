package com.example.backend.service;

import com.example.backend.dto.UserDTO;
import com.example.backend.entity.User;
import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {
    
    private final UserRepository userRepository;
    
    public UserDTO getUserById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("用户不存在"));
        return UserDTO.fromEntity(user);
    }
    
    public UserDTO getCurrentUser(Long userId) {
        return getUserById(userId);
    }
    
    @Transactional
    public UserDTO updateProfile(Long userId, UserDTO userDTO) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("用户不存在"));
        
        if (userDTO.getNickname() != null) {
            user.setNickname(userDTO.getNickname());
        }
        if (userDTO.getAvatar() != null) {
            user.setAvatar(userDTO.getAvatar());
        }
        if (userDTO.getBio() != null) {
            user.setBio(userDTO.getBio());
        }
        
        user = userRepository.save(user);
        return UserDTO.fromEntity(user);
    }

    /**
     * 获取所有用户（管理员功能）
     */
    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(UserDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * 更新用户角色（管理员功能）
     */
    @Transactional
    public UserDTO updateUserRole(Long userId, User.UserRole role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("用户不存在"));
        user.setRole(role);
        User savedUser = userRepository.save(user);
        return UserDTO.fromEntity(savedUser);
    }

    /**
     * 更新用户状态（管理员功能）
     */
    @Transactional
    public UserDTO updateUserStatus(Long userId, User.UserStatus status) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("用户不存在"));
        user.setStatus(status);
        User savedUser = userRepository.save(user);
        return UserDTO.fromEntity(savedUser);
    }

    /**
     * 删除用户（管理员功能）
     */
    @Transactional
    public void deleteUser(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("用户不存在");
        }
        userRepository.deleteById(userId);
    }
}
