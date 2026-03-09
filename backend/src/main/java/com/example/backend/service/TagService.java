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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TagService {
    
    private final TagRepository tagRepository;
    private final UserRepository userRepository;
    
    public List<TagDTO> getAllTagsByUser(Long userId) {
        return tagRepository.findByUserId(userId)
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
}