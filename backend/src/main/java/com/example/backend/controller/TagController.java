package com.example.backend.controller;

import com.example.backend.dto.ApiResponse;
import com.example.backend.dto.TagDTO;
import com.example.backend.dto.TagRequest;
import com.example.backend.entity.User;
import com.example.backend.exception.UnauthorizedException;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.TagService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tags")
@RequiredArgsConstructor
public class TagController {
    
    private final TagService tagService;
    private final UserRepository userRepository;
    
    private User getCurrentUser(Authentication authentication) {
        String username = authentication.getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UnauthorizedException("用户不存在"));
    }
    
    @GetMapping
    public ResponseEntity<ApiResponse<List<TagDTO>>> getAllTags(Authentication authentication) {
        User user = getCurrentUser(authentication);
        List<TagDTO> tags = tagService.getAllTagsByUser(user.getId());
        return ResponseEntity.ok(ApiResponse.success(tags));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TagDTO>> getTagById(
            Authentication authentication,
            @PathVariable Long id) {
        User user = getCurrentUser(authentication);
        TagDTO tag = tagService.getTagById(user.getId(), id);
        return ResponseEntity.ok(ApiResponse.success(tag));
    }
    
    @PostMapping
    public ResponseEntity<ApiResponse<TagDTO>> createTag(
            Authentication authentication,
            @Valid @RequestBody TagRequest request) {
        User user = getCurrentUser(authentication);
        TagDTO tag = tagService.createTag(user.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("标签创建成功", tag));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TagDTO>> updateTag(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody TagRequest request) {
        User user = getCurrentUser(authentication);
        TagDTO tag = tagService.updateTag(user.getId(), id, request);
        return ResponseEntity.ok(ApiResponse.success("标签更新成功", tag));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTag(
            Authentication authentication,
            @PathVariable Long id) {
        User user = getCurrentUser(authentication);
        tagService.deleteTag(user.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("标签删除成功", null));
    }
}
