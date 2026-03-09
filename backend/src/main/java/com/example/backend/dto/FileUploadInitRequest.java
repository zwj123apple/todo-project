package com.example.backend.dto;

import lombok.Data;

@Data
public class FileUploadInitRequest {
    private String filename;
    private Long fileSize;
    private String mimeType;
    private String fileIdentifier; // MD5或其他唯一标识
    private Integer totalChunks;
}