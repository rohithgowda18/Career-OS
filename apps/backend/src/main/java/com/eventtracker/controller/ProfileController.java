package com.eventtracker.controller;

import com.eventtracker.entity.User;
import com.eventtracker.entity.UserProfile;
import com.eventtracker.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/profile")
@RequiredArgsConstructor
@CrossOrigin
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping("/me")
    public ResponseEntity<UserProfile> getMyProfile() {
        return ResponseEntity.of(profileService.getProfileByUserId(getCurrentUserId()));
    }

    @PutMapping("/me")
    public ResponseEntity<UserProfile> updateMyProfile(@RequestBody UserProfile updates) {
        return ResponseEntity.ok(profileService.updateProfile(getCurrentUserId(), updates));
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof User) {
            return ((User) authentication.getPrincipal()).getId();
        }
        throw new RuntimeException("User not authenticated");
    }
}
