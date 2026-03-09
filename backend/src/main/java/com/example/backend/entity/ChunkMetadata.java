package com.example.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "chunk_metadata", 
       uniqueConstraints = @UniqueConstraint(columnNames = {"file_identifier", "chunk_number"}))
public class ChunkMetadata {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String fileIdentifier;
    
    @Column(nullable = false)
    private Integer chunkNumber;
    
    @Column(nullable = false)
    private Long chunkSize;
    
    @Column(nullable = false)
    private String chunkPath;
    
    @Column(nullable = false)
    private Boolean uploaded = false;
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}