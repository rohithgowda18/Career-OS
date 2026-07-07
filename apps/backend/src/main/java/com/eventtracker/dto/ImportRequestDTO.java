package com.eventtracker.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImportRequestDTO {
    
    @NotBlank(message = "Source is required")
    private String source;

    private String title;

    @NotBlank(message = "Content is required")
    private String content;
}
