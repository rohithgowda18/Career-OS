package com.careeros.coding.client;

import com.careeros.coding.client.dto.PlatformProfileData;
import com.careeros.coding.client.dto.PlatformStatsData;
import com.careeros.coding.model.Platform;

import java.util.Optional;

public interface CodingPlatformClient {

    Platform getPlatform();

    Optional<PlatformProfileData> getProfile(String username);

    boolean verifyOwnership(String username, String verificationCode);

    Optional<PlatformStatsData> getStats(String username);
}
