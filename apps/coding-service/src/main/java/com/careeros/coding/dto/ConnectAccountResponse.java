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
public class ConnectAccountResponse {
    private Long accountId;
    private Platform platform;
    private String username;
    private String verificationCode;
    private VerificationStatus verificationStatus;
    private LocalDateTime verificationExpiresAt;
    private String instructions;
}
