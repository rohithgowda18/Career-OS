package com.eventtracker.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExtractionRequest {
    @NotBlank(message = "emailContent cannot be blank")
    @Size(max = 10000, message = "emailContent cannot exceed 10000 characters")
    private String emailContent;
}
