package com.eventtracker.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrackJobApplicationRequest {
    @NotBlank(message = "company is required")
    private String company;

    @NotBlank(message = "title is required")
    private String title;

    private String jobType;
    private String location;
    private String applyUrl;
    private String source;
    private String status;
}
