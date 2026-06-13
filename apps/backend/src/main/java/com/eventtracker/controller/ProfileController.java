package com.eventtracker.controller;

import com.eventtracker.dto.UserProfileDTO;
import com.eventtracker.entity.User;
import com.eventtracker.service.ProfileService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping
    @Operation(operationId = "getProfile", summary = "Get current user profile")
    public ResponseEntity<UserProfileDTO> getMyProfile() {
        return ResponseEntity.of(profileService.getProfileByUserId(getCurrentUserId()));
    }

    @PutMapping
    @Operation(operationId = "updateProfile", summary = "Update current user profile")
    public ResponseEntity<UserProfileDTO> updateMyProfile(@RequestBody UserProfileDTO updates) {
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
