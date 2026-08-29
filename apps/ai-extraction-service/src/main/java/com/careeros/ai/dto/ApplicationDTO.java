package com.careeros.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationDTO {
    private Long id;
    private String eventName;
    private String eventType;
    private String status;
    private LocalDateTime deadline;
    private String notes;
    private String url;
    private String location;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
