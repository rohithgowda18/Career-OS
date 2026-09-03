package com.eventtracker.coding.dto;

import com.eventtracker.coding.entity.Platform;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConnectAccountRequest {

    @NotNull(message = "Platform is required")
    private Platform platform;

    @NotBlank(message = "Username is required")
    private String username;
}
