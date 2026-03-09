package com.example.backend.service;

import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.example.backend.dto.FileUploadInitRequest;
import com.example.backend.dto.FileUploadResponse;
import com.example.backend.entity.ChunkMetadata;
import com.example.backend.entity.FileMetadata;
import com.example.backend.exception.BadRequestException;
import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.repository.ChunkMetadataRepository;
import com.example.backend.repository.FileMetadataRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class FileUploadService {
    
    private final FileMetadataRepository fileMetadataRepository;
    private final ChunkMetadataRepository chunkMetadataRepository;
    
    @Value("${file.upload.dir:uploads}")
    private String uploadDir;
    
    @Value("${file.upload.chunk-dir:uploads/chunks}")
    private String chunkDir;
    
    @Transactional
    public FileUploadResponse initUpload(Long userId, FileUploadInitRequest request) {
        log.info("初始化上传: {}", request.getFileIdentifier());
        
        FileMetadata existing = fileMetadataRepository
                .findByFileIdentifier(request.getFileIdentifier())
                .orElse(null);
        
        if (existing != null) {
            return buildResumeResponse(existing);
        }
        
        FileMetadata metadata = new FileMetadata();
        metadata.setFilename(generateFilename(request.getFilename()));
        metadata.setOriginalFilename(request.getFilename());
        metadata.setFileIdentifier(request.getFileIdentifier());
        metadata.setFileSize(request.getFileSize());
        metadata.setMimeType(request.getMimeType());
        metadata.setUserId(userId);
        metadata.setTotalChunks(request.getTotalChunks());
        metadata.setUploadedChunks(0);
        metadata.setStatus(FileMetadata.UploadStatus.UPLOADING);
        metadata.setFilePath(Paths.get(uploadDir, metadata.getFilename()).toString());
        
        metadata = fileMetadataRepository.save(metadata);
        
        return FileUploadResponse.builder()
                .fileIdentifier(metadata.getFileIdentifier())
                .filename(metadata.getOriginalFilename())
                .fileSize(metadata.getFileSize())
                .totalChunks(metadata.getTotalChunks())
                .uploadedChunks(0)
                .missingChunks(IntStream.range(0, request.getTotalChunks()).boxed().collect(Collectors.toList()))
                .status("UPLOADING")
                .message("初始化成功")
                .build();
    }
    
    @Transactional
    public FileUploadResponse uploadChunk(Long userId, String fileIdentifier, 
                                         Integer chunkNumber, Integer totalChunks, 
                                         MultipartFile chunk) {
        FileMetadata metadata = fileMetadataRepository.findByFileIdentifier(fileIdentifier)
                .orElseThrow(() -> new ResourceNotFoundException("文件不存在"));
        
        if (!metadata.getUserId().equals(userId)) {
            throw new BadRequestException("无权操作");
        }
        
        try {
            String filename = fileIdentifier + "_chunk_" + chunkNumber;
            Path path = Paths.get(chunkDir, filename);
            Files.createDirectories(path.getParent());
            Files.copy(chunk.getInputStream(), path, StandardCopyOption.REPLACE_EXISTING);
            
            ChunkMetadata chunkMeta = chunkMetadataRepository
                    .findByFileIdentifierAndChunkNumber(fileIdentifier, chunkNumber)
                    .orElse(new ChunkMetadata());
            
            chunkMeta.setFileIdentifier(fileIdentifier);
            chunkMeta.setChunkNumber(chunkNumber);
            chunkMeta.setChunkSize(chunk.getSize());
            chunkMeta.setChunkPath(path.toString());
            chunkMeta.setUploaded(true);
            chunkMetadataRepository.save(chunkMeta);
            
            long count = chunkMetadataRepository.countByFileIdentifierAndUploaded(fileIdentifier, true);
            metadata.setUploadedChunks((int) count);
            fileMetadataRepository.save(metadata);
            
            if (count == totalChunks) {
                return mergeChunks(metadata);
            }
            
            return buildProgressResponse(metadata);
            
        } catch (IOException e) {
            throw new BadRequestException("上传失败: " + e.getMessage());
        }
    }
    
    @Transactional
    public FileUploadResponse mergeChunks(FileMetadata metadata) {
        try {
            List<ChunkMetadata> chunks = chunkMetadataRepository
                    .findByFileIdentifierOrderByChunkNumber(metadata.getFileIdentifier());
            
            Path output = Paths.get(metadata.getFilePath());
            Files.createDirectories(output.getParent());
            
            try (FileOutputStream fos = new FileOutputStream(output.toFile());
                 BufferedOutputStream bos = new BufferedOutputStream(fos)) {
                for (ChunkMetadata chunk : chunks) {
                    Files.copy(Paths.get(chunk.getChunkPath()), bos);
                }
                bos.flush();
            }
            
            metadata.setStatus(FileMetadata.UploadStatus.COMPLETED);
            fileMetadataRepository.save(metadata);
            
            deleteChunks(chunks);
            
            return FileUploadResponse.builder()
                    .fileIdentifier(metadata.getFileIdentifier())
                    .filename(metadata.getOriginalFilename())
                    .status("COMPLETED")
                    .message("上传完成")
                    .fileUrl("/api/files/" + metadata.getId())
                    .build();
            
        } catch (IOException e) {
            metadata.setStatus(FileMetadata.UploadStatus.FAILED);
            fileMetadataRepository.save(metadata);
            throw new BadRequestException("合并失败: " + e.getMessage());
        }
    }
    
    public File downloadFile(Long userId, Long fileId) {
        FileMetadata metadata = fileMetadataRepository.findById(fileId)
                .orElseThrow(() -> new ResourceNotFoundException("文件不存在"));
        
        if (!metadata.getUserId().equals(userId)) {
            throw new BadRequestException("无权下载");
        }
        
        File file = new File(metadata.getFilePath());
        if (!file.exists()) {
            throw new ResourceNotFoundException("文件不存在");
        }
        
        return file;
    }
    
    private FileUploadResponse buildResumeResponse(FileMetadata metadata) {
        List<Integer> uploaded = chunkMetadataRepository
                .findByFileIdentifierOrderByChunkNumber(metadata.getFileIdentifier())
                .stream()
                .filter(ChunkMetadata::getUploaded)
                .map(ChunkMetadata::getChunkNumber)
                .collect(Collectors.toList());
        
        List<Integer> missing = IntStream.range(0, metadata.getTotalChunks())
                .boxed()
                .filter(i -> !uploaded.contains(i))
                .collect(Collectors.toList());
        
        return FileUploadResponse.builder()
                .fileIdentifier(metadata.getFileIdentifier())
                .filename(metadata.getOriginalFilename())
                .uploadedChunks(uploaded.size())
                .totalChunks(metadata.getTotalChunks())
                .missingChunks(missing)
                .status(metadata.getStatus().toString())
                .message("支持断点续传")
                .build();
    }
    
    private FileUploadResponse buildProgressResponse(FileMetadata metadata) {
        return buildResumeResponse(metadata);
    }
    
    private void deleteChunks(List<ChunkMetadata> chunks) {
        for (ChunkMetadata chunk : chunks) {
            try {
                Files.deleteIfExists(Paths.get(chunk.getChunkPath()));
            } catch (IOException e) {
                log.warn("删除分片失败: {}", chunk.getChunkPath(), e);
            }
        }
        chunkMetadataRepository.deleteAll(chunks);
    }
    
    private String generateFilename(String original) {
        String ext = "";
        int i = original.lastIndexOf('.');
        if (i > 0) {
            ext = original.substring(i);
        }
        return UUID.randomUUID().toString() + ext;
    }
    
    // 查询用户的文件列表（分页）
    public org.springframework.data.domain.Page<FileMetadata> getFileList(Long userId, int page, int size) {
       Pageable pageable = PageRequest.of(page, size, 
       Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));
        return fileMetadataRepository.findByUserId(userId, pageable);
    }
    
    // 删除文件
    @Transactional
    public void deleteFile(Long userId, Long fileId) {
        FileMetadata metadata = fileMetadataRepository.findById(fileId)
                .orElseThrow(() -> new ResourceNotFoundException("文件不存在"));
        
        if (!metadata.getUserId().equals(userId)) {
            throw new BadRequestException("无权删除此文件");
        }
        
        // 删除文件
        try {
            Files.deleteIfExists(Paths.get(metadata.getFilePath()));
        } catch (IOException e) {
            log.warn("删除文件失败: {}", metadata.getFilePath(), e);
        }
        
        // 删除分片（如果有）
        List<ChunkMetadata> chunks = chunkMetadataRepository
                .findByFileIdentifierOrderByChunkNumber(metadata.getFileIdentifier());
        deleteChunks(chunks);
        
        // 删除数据库记录
        fileMetadataRepository.delete(metadata);
        
        log.info("文件已删除: {}", fileId);
    }
}
