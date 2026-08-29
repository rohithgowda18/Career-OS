package com.eventtracker.dto;

import com.eventtracker.entity.Skill.SkillCategory;
import com.eventtracker.entity.Skill.SkillLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SkillDTO {
    private Long id;
    private String name;
    private SkillCategory category;
    private SkillLevel level;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
