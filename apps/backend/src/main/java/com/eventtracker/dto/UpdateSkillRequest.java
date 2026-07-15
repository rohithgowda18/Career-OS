package com.eventtracker.dto;

import com.eventtracker.entity.SkillCategory;
import com.eventtracker.entity.SkillLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateSkillRequest {
    @NotBlank(message = "Skill name is required")
    private String name;

    @NotNull(message = "Category is required")
    private SkillCategory category;

    @NotNull(message = "Level is required")
    private SkillLevel level;
}
