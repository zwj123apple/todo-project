package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileMetadataDTO {
    private Long id;
    private String filename;
    private String originalFilename;
    private String fileIdentifier;
    private Long fileSize;
    private String mimeType;
    private String status;
    private Integer totalChunks;
    private Integer uploadedChunks;
    private LocalDateTime uploadTime;  // 对应FileMetadata的createdAt
    private String filePath;
}
