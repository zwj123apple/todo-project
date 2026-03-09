package com.example.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "file_metadata")
public class FileMetadata {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String filename;
    
    @Column(nullable = false)
    private String originalFilename;
    
    @Column(nullable = false, unique = true)
    private String fileIdentifier; // MD5或唯一标识
    
    @Column(nullable = false)
    private Long fileSize;
    
    @Column(nullable = false)
    private String mimeType;
    
    @Column(nullable = false)
    private String filePath;
    
    @Column(nullable = false)
    private Long userId;
    
    @Column(nullable = false)
    private Integer totalChunks;
    
    @Column(nullable = false)
    private Integer uploadedChunks = 0;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UploadStatus status = UploadStatus.UPLOADING;
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    public enum UploadStatus {
        UPLOADING,
        COMPLETED,
        FAILED,
        CANCELLED
    }
}