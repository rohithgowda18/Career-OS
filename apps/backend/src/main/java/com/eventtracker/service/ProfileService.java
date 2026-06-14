package com.eventtracker.service;

import com.eventtracker.dto.UserProfileDTO;
import com.eventtracker.entity.UserProfile;
import com.eventtracker.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ProfileService {
    private final UserProfileRepository profileRepository;

    public Optional<UserProfileDTO> getProfileByUserId(Long userId) {
        return profileRepository.findByUserId(userId).map(this::convertToDTO);
    }

    public UserProfileDTO updateProfile(Long userId, UserProfileDTO updates) {
        UserProfile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Profile not found"));

        if (updates.getCollege() != null) profile.setCollege(updates.getCollege());
        if (updates.getSkills() != null) profile.setSkills(updates.getSkills());
        if (updates.getGithubUrl() != null) profile.setGithubUrl(updates.getGithubUrl());
        if (updates.getLinkedinUrl() != null) profile.setLinkedinUrl(updates.getLinkedinUrl());
        if (updates.getPortfolioUrl() != null) profile.setPortfolioUrl(updates.getPortfolioUrl());
        if (updates.getLocation() != null) profile.setLocation(updates.getLocation());
        if (updates.getEmailAlerts() != null) profile.setEmailAlerts(updates.getEmailAlerts());
        if (updates.getWeeklyDigest() != null) profile.setWeeklyDigest(updates.getWeeklyDigest());

        return convertToDTO(profileRepository.save(profile));
    }

    public UserProfileDTO convertToDTO(UserProfile profile) {
        if (profile == null) return null;
        return UserProfileDTO.builder()
                .id(profile.getId())
                .userId(profile.getUser() != null ? profile.getUser().getId() : null)
                .email(profile.getEmail())
                .college(profile.getCollege())
                .skills(profile.getSkills())
                .githubUrl(profile.getGithubUrl())
                .linkedinUrl(profile.getLinkedinUrl())
                .portfolioUrl(profile.getPortfolioUrl())
                .location(profile.getLocation())
                .emailAlerts(profile.getEmailAlerts())
                .weeklyDigest(profile.getWeeklyDigest())
                .createdAt(profile.getCreatedAt())
                .updatedAt(profile.getUpdatedAt())
                .build();
    }
}
