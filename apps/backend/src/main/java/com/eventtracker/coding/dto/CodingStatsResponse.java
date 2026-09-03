package com.eventtracker.coding.dto;

import com.eventtracker.coding.entity.Platform;
import com.eventtracker.coding.entity.VerificationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CodingStatsResponse {
    private Long accountId;
    private Platform platform;
    private String username;
    private VerificationStatus verificationStatus;
    private int totalSolved;
    private int easy;
    private int medium;
    private int hard;
    private Double rating;
    private Integer currentStreak;
    private LocalDateTime syncedAt;
    private LocalDateTime verifiedAt;
}
