package com.eventtracker.coding.client.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlatformProfileData {
    private String username;
    private String realName;
    private String aboutMe;
    private String avatarUrl;
    private boolean exists;
}
