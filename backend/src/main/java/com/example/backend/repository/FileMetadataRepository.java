package com.example.backend.repository;

import com.example.backend.entity.FileMetadata;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FileMetadataRepository extends JpaRepository<FileMetadata, Long> {
    
    Optional<FileMetadata> findByFileIdentifier(String fileIdentifier);
    
    // 分页查询用户文件列表
    Page<FileMetadata> findByUserId(Long userId, Pageable pageable);
    
    List<FileMetadata> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    List<FileMetadata> findByUserIdAndStatus(Long userId, FileMetadata.UploadStatus status);
}
