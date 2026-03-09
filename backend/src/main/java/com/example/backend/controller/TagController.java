package com.example.backend.controller;

import com.example.backend.dto.ApiResponse;
import com.example.backend.dto.TagDTO;
import com.example.backend.dto.TagRequest;
import com.example.backend.service.TagService;
import com.example.backend.util.JwtUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tags")
@RequiredArgsConstructor
public class TagController {
    
    private final TagService tagService;
    private final JwtUtil jwtUtil;
    
    private Long getUserIdFromToken(String token) {
        String jwt = token.substring(7);
        return jwtUtil.extractUserId(jwt);
    }
    
    @GetMapping
    public ResponseEntity<ApiResponse<List<TagDTO>>> getAllTags(
            @RequestHeader("Authorization") String token) {
        Long userId = getUserIdFromToken(token);
        List<TagDTO> tags = tagService.getAllTagsByUser(userId);
        return ResponseEntity.ok(ApiResponse.success(tags));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TagDTO>> getTagById(
            @RequestHeader("Authorization") String token,
            @PathVariable Long id) {
        Long userId = getUserIdFromToken(token);
        TagDTO tag = tagService.getTagById(userId, id);
        return ResponseEntity.ok(ApiResponse.success(tag));
    }
    
    @PostMapping
    public ResponseEntity<ApiResponse<TagDTO>> createTag(
            @RequestHeader("Authorization") String token,
            @Valid @RequestBody TagRequest request) {
        Long userId = getUserIdFromToken(token);
        TagDTO tag = tagService.createTag(userId, request);
        return ResponseEntity.ok(ApiResponse.success("标签创建成功", tag));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TagDTO>> updateTag(
            @RequestHeader("Authorization") String token,
            @PathVariable Long id,
            @Valid @RequestBody TagRequest request) {
        Long userId = getUserIdFromToken(token);
        TagDTO tag = tagService.updateTag(userId, id, request);
        return ResponseEntity.ok(ApiResponse.success("标签更新成功", tag));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTag(
            @RequestHeader("Authorization") String token,
            @PathVariable Long id) {
        Long userId = getUserIdFromToken(token);
        tagService.deleteTag(userId, id);
        return ResponseEntity.ok(ApiResponse.success("标签删除成功", null));
    }
}