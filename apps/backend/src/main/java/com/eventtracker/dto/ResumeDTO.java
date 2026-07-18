package com.eventtracker.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResumeDTO {
    private Long id;
    private Long userId;
    private String name;
    private String filePath;
    private String fileName;
    private Long fileSize;
    private LocalDateTime createdAt;
}
