package com.example.backend.controller;

import java.io.File;

import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.backend.dto.FileMetadataDTO;
import com.example.backend.dto.FileUploadInitRequest;
import com.example.backend.dto.FileUploadResponse;
import com.example.backend.entity.FileMetadata;
import com.example.backend.entity.User;
import com.example.backend.exception.UnauthorizedException;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.FileUploadService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@Tag(name = "文件上传", description = "分片上传、断点续传")
@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
public class FileUploadController {

    private final FileUploadService fileUploadService;
    private final UserRepository userRepository;

    private User getCurrentUser(Authentication authentication) {
        String username = authentication.getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UnauthorizedException("用户不存在"));
    }
    
    @Operation(summary = "获取文件列表")
    @GetMapping
    public ResponseEntity<org.springframework.data.domain.Page<FileMetadataDTO>> getFileList(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {
        User user = getCurrentUser(authentication);
        
        Page<FileMetadata> filePage = fileUploadService.getFileList(user.getId(), page, size);
        Page<FileMetadataDTO> dtoPage = filePage.map(this::convertToDTO);
        
        return ResponseEntity.ok(dtoPage);
    }
    
    @Operation(summary = "初始化上传")
    @PostMapping("/init")
    public ResponseEntity<FileUploadResponse> initUpload(@Valid @RequestBody FileUploadInitRequest request,
                                                          Authentication authentication) {
    	User user = getCurrentUser(authentication);
        
        FileUploadResponse response = fileUploadService.initUpload(user.getId(),request);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "上传分片")
    @PostMapping("/chunk")
    public ResponseEntity<FileUploadResponse> uploadChunk(
            @RequestParam String fileIdentifier,
            @RequestParam Integer chunkNumber,
            @RequestParam Integer totalChunks,
            @RequestParam MultipartFile chunk,
            Authentication auth) {
        User user = getCurrentUser(auth);
        return ResponseEntity.ok(fileUploadService.uploadChunk(
                user.getId(), fileIdentifier, chunkNumber, totalChunks, chunk));
    }

    @Operation(summary = "下载文件")
    @GetMapping("/{fileId}/download")
    public ResponseEntity<Resource> downloadFile(
            @PathVariable Long fileId,
            Authentication auth) {
    	User user = getCurrentUser(auth);
        File file = fileUploadService.downloadFile(user.getId(), fileId);
        
        Resource resource = new FileSystemResource(file);
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, 
                        "attachment; filename=\"" + file.getName() + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(resource);
    }
    
    @Operation(summary = "删除文件")
    @DeleteMapping("/{fileId}")
    public ResponseEntity<Void> deleteFile(
            @PathVariable Long fileId,
            Authentication auth) {
        User user = getCurrentUser(auth);
        fileUploadService.deleteFile(user.getId(), fileId);
        return ResponseEntity.ok().build();
    }
    
    private FileMetadataDTO convertToDTO(FileMetadata metadata) {
        return FileMetadataDTO.builder()
                .id(metadata.getId())
                .filename(metadata.getFilename())
                .originalFilename(metadata.getOriginalFilename())
                .fileIdentifier(metadata.getFileIdentifier())
                .fileSize(metadata.getFileSize())
                .mimeType(metadata.getMimeType())
                .status(metadata.getStatus().toString())
                .totalChunks(metadata.getTotalChunks())
                .uploadedChunks(metadata.getUploadedChunks())
                .uploadTime(metadata.getCreatedAt())  // 使用createdAt作为uploadTime
                .filePath(metadata.getFilePath())
                .build();
    }
}
