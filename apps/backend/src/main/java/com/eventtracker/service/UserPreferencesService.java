package com.eventtracker.service;

import com.eventtracker.entity.User;
import com.eventtracker.entity.UserPreferences;
import com.eventtracker.repository.UserPreferencesRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserPreferencesService {

    private final UserPreferencesRepository preferencesRepository;

    public UserPreferences getPreferences(Long userId) {
        return preferencesRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultPreferences(userId));
    }

    @Transactional
    public UserPreferences updatePreferences(Long userId, UserPreferences updatedPreferences) {
        UserPreferences existing = getPreferences(userId);
        
        existing.setEmailNotifications(updatedPreferences.getEmailNotifications());
        existing.setDeadlineReminders(updatedPreferences.getDeadlineReminders());
        existing.setDigestFrequency(updatedPreferences.getDigestFrequency());
        existing.setPreferredEventTypes(updatedPreferences.getPreferredEventTypes());
        existing.setTimezone(updatedPreferences.getTimezone());
        existing.setTheme(updatedPreferences.getTheme());
        existing.setLanguage(updatedPreferences.getLanguage());
        existing.setReceiveRecommendations(updatedPreferences.getReceiveRecommendations());
        
        return preferencesRepository.save(existing);
    }

    private UserPreferences createDefaultPreferences(Long userId) {
        UserPreferences prefs = new UserPreferences();
        User user = new User();
        user.setId(userId);
        prefs.setUser(user);
        return preferencesRepository.save(prefs);
    }
}
