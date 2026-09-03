package com.eventtracker.coding.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CodingStatsHistoryDTO {
    private Long id;
    private int totalSolved;
    private int easy;
    private int medium;
    private int hard;
    private Double rating;
    private LocalDateTime recordedAt;
}
