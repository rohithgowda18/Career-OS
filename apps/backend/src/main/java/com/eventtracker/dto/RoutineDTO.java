package com.eventtracker.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoutineDTO {
    private Long id;
    private Long userId;

    @NotBlank(message = "Task title is required")
    private String title;

    private int displayOrder;
    private boolean completed;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
