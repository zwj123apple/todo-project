package com.example.backend.repository;

import com.example.backend.entity.ChunkMetadata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChunkMetadataRepository extends JpaRepository<ChunkMetadata, Long> {
    
    List<ChunkMetadata> findByFileIdentifierOrderByChunkNumber(String fileIdentifier);
    
    Optional<ChunkMetadata> findByFileIdentifierAndChunkNumber(String fileIdentifier, Integer chunkNumber);
    
    long countByFileIdentifierAndUploaded(String fileIdentifier, Boolean uploaded);
    
    void deleteByFileIdentifier(String fileIdentifier);
}