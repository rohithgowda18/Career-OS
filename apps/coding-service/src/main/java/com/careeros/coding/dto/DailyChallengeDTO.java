package com.careeros.coding.dto;

import com.careeros.coding.model.Platform;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyChallengeDTO {
    private Platform platform;
    private String platformName;
    private String title;
    private String problemUrl;
    private String difficulty;
    private LocalDate date;
    private boolean available;
    private String note;
}
