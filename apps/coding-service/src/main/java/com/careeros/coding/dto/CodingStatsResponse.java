package com.careeros.coding.dto;

import com.careeros.coding.model.Platform;
import com.careeros.coding.model.VerificationStatus;
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
