package com.eventtracker.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreatePlacementRequest {
    @NotBlank(message = "Company name is required")
    private String companyName;

    @NotBlank(message = "Role is required")
    private String role;

    private String location;
    
    private String stipend;
    private String ctc;

    @org.hibernate.validator.constraints.URL(message = "Invalid application link URL")
    private String applicationLink;

    private LocalDateTime registrationDeadline;

    private LocalDateTime assessmentDate;

    private LocalDateTime interviewDate;

    @NotBlank(message = "Status is required")
    private String status;
}
