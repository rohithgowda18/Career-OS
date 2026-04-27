package com.eventtracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MetadataResponseDTO {
    private String title;
    private String description;
    private String image;
    private String eventType;
    private LocalDate deadline;
    private String url;
    private String error;
    private boolean success;
}
