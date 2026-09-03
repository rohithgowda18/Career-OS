package com.eventtracker.coding.client;

import com.eventtracker.coding.client.dto.PlatformProfileData;
import com.eventtracker.coding.client.dto.PlatformStatsData;
import com.eventtracker.coding.entity.Platform;

import java.util.Optional;

public interface CodingPlatformClient {

    Platform getPlatform();

    Optional<PlatformProfileData> getProfile(String username);

    boolean verifyOwnership(String username, String verificationCode);

    Optional<PlatformStatsData> getStats(String username);
}
