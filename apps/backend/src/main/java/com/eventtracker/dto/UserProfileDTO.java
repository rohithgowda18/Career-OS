package com.eventtracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDTO {
    private Long id;
    private Long userId;
    private String email;
    private String college;
    private String skills;
    private String githubUrl;
    private String linkedinUrl;
    private String portfolioUrl;
    private String location;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
