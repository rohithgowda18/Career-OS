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
public class SaveJobRequest {
    @NotBlank(message = "externalJobId is required")
    private String externalJobId;

    @NotBlank(message = "source is required")
    private String source;
}
