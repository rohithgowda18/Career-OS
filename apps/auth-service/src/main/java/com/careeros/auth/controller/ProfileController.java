package com.careeros.auth.controller;

import com.careeros.auth.dto.UserProfileDTO;
import com.careeros.auth.entity.User;
import com.careeros.auth.service.ProfileService;
import com.careeros.auth.security.UserPrincipal;
import jakarta.validation.Valid;
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
    public ResponseEntity<UserProfileDTO> getMyProfile() {
        return ResponseEntity.of(profileService.getProfileByUserId(getCurrentUserId()));
    }

    @PutMapping
    public ResponseEntity<UserProfileDTO> updateMyProfile(@RequestBody UserProfileDTO updates) {
        return ResponseEntity.ok(profileService.updateProfile(getCurrentUserId(), updates));
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null) {
            Object principal = authentication.getPrincipal();
            if (principal instanceof UserPrincipal) {
                return ((UserPrincipal) principal).getId();
            } else if (principal instanceof User) {
                return ((User) principal).getId();
            }
        }
        throw new RuntimeException("User not authenticated");
    }
}
