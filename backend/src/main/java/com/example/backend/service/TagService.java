package com.example.backend.service;

import com.example.backend.dto.TagDTO;
import com.example.backend.dto.TagRequest;
import com.example.backend.entity.Tag;
import com.example.backend.entity.User;
import com.example.backend.exception.BadRequestException;
import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.repository.TagRepository;
import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TagService {
    
    private final TagRepository tagRepository;
    private final UserRepository userRepository;
    
    @Transactional
    public List<TagDTO> getAllTagsByUser(Long userId) {
        log.info("获取用户 {} 的标签列表", userId);
        List<Tag> tags = tagRepository.findByUserId(userId);
        log.info("用户 {} 当前有 {} 个标签", userId, tags.size());
        
        // 如果用户没有标签，自动创建默认标签
        if (tags.isEmpty()) {
            log.info("用户 {} 没有标签，开始创建默认标签", userId);
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("用户不存在"));
            createDefaultTagsForUser(user);
            tags = tagRepository.findByUserId(userId);
            log.info("用户 {} 创建默认标签后，现在有 {} 个标签", userId, tags.size());
        }
        
        return tags
                .stream()
                .map(TagDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    public TagDTO getTagById(Long userId, Long tagId) {
        Tag tag = tagRepository.findById(tagId)
                .orElseThrow(() -> new ResourceNotFoundException("标签不存在"));
        
        if (!tag.getUser().getId().equals(userId)) {
            throw new BadRequestException("无权访问此标签");
        }
        
        return TagDTO.fromEntity(tag);
    }
    
    @Transactional
    public TagDTO createTag(Long userId, TagRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("用户不存在"));
        
        if (tagRepository.existsByUserIdAndName(userId, request.getName())) {
            throw new BadRequestException("标签名称已存在");
        }
        
        Tag tag = new Tag();
        tag.setName(request.getName());
        tag.setColor(request.getColor());
        tag.setUser(user);
        
        tag = tagRepository.save(tag);
        return TagDTO.fromEntity(tag);
    }
    
    @Transactional
    public TagDTO updateTag(Long userId, Long tagId, TagRequest request) {
        Tag tag = tagRepository.findById(tagId)
                .orElseThrow(() -> new ResourceNotFoundException("标签不存在"));
        
        if (!tag.getUser().getId().equals(userId)) {
            throw new BadRequestException("无权修改此标签");
        }
        
        if (!tag.getName().equals(request.getName()) && 
            tagRepository.existsByUserIdAndName(userId, request.getName())) {
            throw new BadRequestException("标签名称已存在");
        }
        
        tag.setName(request.getName());
        tag.setColor(request.getColor());
        
        tag = tagRepository.save(tag);
        return TagDTO.fromEntity(tag);
    }
    
    @Transactional
    public void deleteTag(Long userId, Long tagId) {
        Tag tag = tagRepository.findById(tagId)
                .orElseThrow(() -> new ResourceNotFoundException("标签不存在"));
        
        if (!tag.getUser().getId().equals(userId)) {
            throw new BadRequestException("无权删除此标签");
        }
        
        tagRepository.delete(tag);
    }
    
    /**
     * 为用户创建默认标签
     * 该方法会在用户首次获取标签列表时调用（如果用户没有任何标签）
     */
    private void createDefaultTagsForUser(User user) {
        log.info("开始为用户 {} ({}) 创建默认标签", user.getId(), user.getUsername());
        List<String> defaultTagNames = Arrays.asList("工作", "个人", "学习", "紧急", "重要");
        List<String> defaultTagColors = Arrays.asList("#EF4444", "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6");
        
        for (int i = 0; i < defaultTagNames.size(); i++) {
            try {
                Tag tag = new Tag();
                tag.setName(defaultTagNames.get(i));
                tag.setColor(defaultTagColors.get(i));
                tag.setUser(user);
                tag.setCreatedAt(LocalDateTime.now());
                
                tagRepository.save(tag);
                log.info("成功创建标签: {} ({})", defaultTagNames.get(i), defaultTagColors.get(i));
            } catch (Exception e) {
                log.error("创建标签失败: {} - {}", defaultTagNames.get(i), e.getMessage());
            }
        }
    }
}