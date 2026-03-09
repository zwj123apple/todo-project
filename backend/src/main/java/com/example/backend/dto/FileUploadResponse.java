package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileUploadResponse {
    private String fileIdentifier;
    private String filename;
    private Long fileSize;
    private Integer totalChunks;
    private Integer uploadedChunks;
    private List<Integer> missingChunks; // 用于断点续传
    private String status;
    private String message;
    private String fileUrl; // 完成后的文件访问URL
}