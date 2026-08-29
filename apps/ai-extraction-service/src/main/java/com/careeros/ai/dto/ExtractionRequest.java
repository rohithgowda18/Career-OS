package com.careeros.ai.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ExtractionRequest {
    @NotBlank(message = "emailContent is required")
    private String emailContent;
}
