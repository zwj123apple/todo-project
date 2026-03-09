package com.example.backend.dto;

import com.example.backend.entity.Tag;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TagDTO {
    
    private Long id;
    private String name;
    private String color;
    private Long userId;
    private LocalDateTime createdAt;
    
    public static TagDTO fromEntity(Tag tag) {
        TagDTO dto = new TagDTO();
        dto.setId(tag.getId());
        dto.setName(tag.getName());
        dto.setColor(tag.getColor());
        dto.setUserId(tag.getUser().getId());
        dto.setCreatedAt(tag.getCreatedAt());
        return dto;
    }
}