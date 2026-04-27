package com.eventtracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequestDTO {
    private String skillsJson;
    private String interests;
    private String experienceLevel;
    private String preferredEventTypes;
    private String location;
    private String timezone;
}
