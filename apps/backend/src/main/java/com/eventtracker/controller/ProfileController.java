package com.eventtracker.controller;

import com.eventtracker.entity.User;
import com.eventtracker.entity.UserProfile;
import com.eventtracker.repository.UserProfileRepository;
import com.eventtracker.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/profile")
@RequiredArgsConstructor
@CrossOrigin
public class ProfileController {

    private final ProfileService profileService;
    private final UserProfileRepository profileRepository;

    @GetMapping("/me")
    public ResponseEntity<UserProfile> getMyProfile() {
        Long userId = getCurrentUserId();
        return ResponseEntity.of(profileRepository.findByUserId(userId));
    }

    @GetMapping("/public/{username}")
    public ResponseEntity<Map<String, Object>> getPublicProfile(@PathVariable String username) {
        return ResponseEntity.ok(profileService.getPublicProfileData(username));
    }

    @PutMapping("/visibility")
    public ResponseEntity<UserProfile> updateVisibility(@RequestParam Boolean isPublic) {
        Long userId = getCurrentUserId();
        UserProfile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Profile not found"));

        profile.setIsPublic(isPublic);
        return ResponseEntity.ok(profileRepository.save(profile));
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User user = (User) authentication.getPrincipal();
        return user.getId();
    }
}
