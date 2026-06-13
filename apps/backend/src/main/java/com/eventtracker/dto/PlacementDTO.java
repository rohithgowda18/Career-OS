package com.eventtracker.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlacementDTO {
    private Long id;
    private Long userId;

    @NotBlank(message = "Company name is required")
    private String companyName;

    @NotBlank(message = "Role is required")
    private String role;

    private String location;
    private String stipend;
    private String ctc;

    @org.hibernate.validator.constraints.URL(message = "Invalid application link URL")
    private String applicationLink;

    private LocalDateTime assessmentDate;
    private LocalDateTime interviewDate;

    @NotBlank(message = "Status is required")
    private String status;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
