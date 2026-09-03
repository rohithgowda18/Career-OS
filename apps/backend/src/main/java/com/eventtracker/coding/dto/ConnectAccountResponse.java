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
public class ConnectAccountResponse {
    private Long accountId;
    private Platform platform;
    private String username;
    private String verificationCode;
    private VerificationStatus verificationStatus;
    private LocalDateTime verificationExpiresAt;
    private String instructions;
}
