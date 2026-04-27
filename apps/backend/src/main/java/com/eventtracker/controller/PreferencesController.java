package com.eventtracker.controller;

import com.eventtracker.entity.User;
import com.eventtracker.entity.UserPreferences;
import com.eventtracker.service.UserPreferencesService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/preferences")
@RequiredArgsConstructor
@CrossOrigin
public class PreferencesController {

    private final UserPreferencesService preferencesService;

    @GetMapping
    public ResponseEntity<UserPreferences> getPreferences() {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(preferencesService.getPreferences(userId));
    }

    @PutMapping
    public ResponseEntity<UserPreferences> updatePreferences(@RequestBody UserPreferences updatedPreferences) {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(preferencesService.updatePreferences(userId, updatedPreferences));
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User user = (User) authentication.getPrincipal();
        return user.getId();
    }
}
