package com.eventtracker.service;

import com.eventtracker.entity.Application;
import com.eventtracker.entity.UserProfile;
import com.eventtracker.repository.ApplicationRepository;
import com.eventtracker.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserProfileRepository profileRepository;
    private final ApplicationRepository applicationRepository;
    private final AnalyticsService analyticsService;

    public Optional<UserProfile> getProfileByUsername(String username) {
        return profileRepository.findByUsername(username);
    }

    public Map<String, Object> getPublicProfileData(String username) {
        UserProfile profile = profileRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Profile not found"));

        if (!profile.getIsPublic()) {
            throw new IllegalStateException("Profile is private");
        }

        Map<String, Object> data = new HashMap<>();
        data.put("profile", profile);
        data.put("stats", analyticsService.getSummary(profile.getUser().getId()));
        
        // Only show accepted applications for public profiles (optional but common)
        List<Application> apps = applicationRepository.findByUserId(profile.getUser().getId());
        data.put("applications", apps.stream()
                .filter(a -> a.getStatus().name().equals("Accepted"))
                .toList());

        return data;
    }
}
