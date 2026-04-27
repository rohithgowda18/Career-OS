package com.eventtracker.controller;

import com.eventtracker.dto.RecommendationResponseDTO;
import com.eventtracker.dto.UpdateProfileRequestDTO;
import com.eventtracker.entity.User;
import com.eventtracker.entity.UserProfile;
import com.eventtracker.repository.UserProfileRepository;
import com.eventtracker.service.RecommendationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/recommendations")
@RequiredArgsConstructor
@CrossOrigin
public class RecommendationController {

    private final RecommendationService recommendationService;
    private final UserProfileRepository profileRepository;

    @GetMapping("/generate")
    public ResponseEntity<List<RecommendationResponseDTO>> generateRecommendations() {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(recommendationService.generatePersonalizedRecommendations(userId));
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateUserProfile(@RequestBody UpdateProfileRequestDTO request) {
        Long userId = getCurrentUserId();
        UserProfile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Profile not found"));

        if (request.getSkillsJson() != null) profile.setSkillsJson(request.getSkillsJson());
        if (request.getInterests() != null) profile.setInterests(request.getInterests());
        if (request.getExperienceLevel() != null) profile.setExperienceLevel(request.getExperienceLevel());
        if (request.getPreferredEventTypes() != null) profile.setPreferredEventTypes(request.getPreferredEventTypes());
        if (request.getLocation() != null) profile.setLocation(request.getLocation());
        if (request.getTimezone() != null) profile.setTimezone(request.getTimezone());

        return ResponseEntity.ok(profileRepository.save(profile));
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("User not authenticated");
        }
        User user = (User) authentication.getPrincipal();
        return user.getId();
    }
}
