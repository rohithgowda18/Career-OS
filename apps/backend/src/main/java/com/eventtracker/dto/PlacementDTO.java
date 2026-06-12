package com.eventtracker.dto;

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
    private String companyName;
    private String role;
    private String location;
    private String stipend;
    private String ctc;
    private String applicationLink;
    private LocalDateTime registrationDeadline;
    private LocalDateTime assessmentDate;
    private LocalDateTime interviewDate;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
