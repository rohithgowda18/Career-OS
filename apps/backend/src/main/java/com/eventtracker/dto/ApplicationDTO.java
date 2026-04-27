package com.eventtracker.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationDTO {
    private Long id;

    @NotBlank(message = "Event name is required")
    private String eventName;

    @NotNull(message = "Event type is required")
    private String eventType;

    @NotNull(message = "Status is required")
    private String status;

    private LocalDateTime deadline;

    private String notes;

    private String url;

    private Double successScore;

    private Boolean isFavorite;

    private String rejectionReason;

    private String applicationLink;

    private String tags;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
