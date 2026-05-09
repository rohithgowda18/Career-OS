package com.eventtracker.service;

import com.eventtracker.entity.UserProfile;
import com.eventtracker.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ProfileService {
    private final UserProfileRepository profileRepository;

    public Optional<UserProfile> getProfileByUserId(Long userId) {
        return profileRepository.findByUserId(userId);
    }

    public UserProfile updateProfile(Long userId, UserProfile updates) {
        UserProfile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Profile not found"));

        if (updates.getCollege() != null) profile.setCollege(updates.getCollege());
        if (updates.getSkills() != null) profile.setSkills(updates.getSkills());
        if (updates.getGithubUrl() != null) profile.setGithubUrl(updates.getGithubUrl());
        if (updates.getLinkedinUrl() != null) profile.setLinkedinUrl(updates.getLinkedinUrl());
        if (updates.getPortfolioUrl() != null) profile.setPortfolioUrl(updates.getPortfolioUrl());
        if (updates.getLocation() != null) profile.setLocation(updates.getLocation());

        return profileRepository.save(profile);
    }
}
