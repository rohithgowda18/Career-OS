package com.eventtracker.service;

import com.eventtracker.dto.UserDTO;
import com.eventtracker.entity.User;
import com.eventtracker.entity.UserProfile;
import com.eventtracker.entity.UserPreferences;
import com.eventtracker.exception.DuplicateUserException;
import com.eventtracker.repository.UserRepository;
import com.eventtracker.repository.UserProfileRepository;
import com.eventtracker.repository.UserPreferencesRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final UserPreferencesRepository userPreferencesRepository;
    private final PasswordEncoder passwordEncoder;

    public User createUser(String email, String password, String firstName, String lastName, String username) {
        String normalizedEmail = normalizeEmail(email);
        if (normalizedEmail.isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (password == null || password.isBlank()) {
            throw new IllegalArgumentException("Password is required");
        }
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new DuplicateUserException("Email already exists");
        }

        String uniqueUsername = makeUniqueUsername(username, normalizedEmail);

        User user = new User();
        user.setEmail(normalizedEmail);
        user.setPassword(passwordEncoder.encode(password));
        user.setFirstName(normalizeNullableName(firstName));
        user.setLastName(normalizeNullableName(lastName));
        user.setUsername(uniqueUsername);
        user.setIsActive(true);

        user = userRepository.save(user);

        // Create default preferences
        UserPreferences preferences = new UserPreferences();
        preferences.setUser(user);
        userPreferencesRepository.save(preferences);

        // Create default profile
        UserProfile profile = new UserProfile();
        profile.setUser(user);
        profile.setUsername(uniqueUsername);
        profile.setIsPublic(false);
        userProfileRepository.save(profile);

        return user;
    }

    private String makeUniqueUsername(String requestedUsername, String email) {
        String base = normalizeUsername(requestedUsername);
        if (!base.isBlank() && userRepository.existsByUsernameIgnoreCase(base)) {
            throw new DuplicateUserException("Username already exists");
        }

        int atIndex = email.indexOf('@');
        if (base.isBlank() && atIndex > 0) {
            base = normalizeUsername(email.substring(0, email.indexOf('@')));
        }
        if (base.isBlank()) {
            base = "user";
        }

        String candidate = base;
        int suffix = 1;
        while (userRepository.existsByUsernameIgnoreCase(candidate)) {
            candidate = base + suffix;
            suffix++;
        }
        return candidate;
    }

    private String normalizeUsername(String value) {
        if (value == null) {
            return "";
        }
        String normalized = value.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");
        return normalized.length() > 40 ? normalized.substring(0, 40) : normalized;
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeNullableName(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    public Optional<User> findByEmail(String email) {
        String normalizedEmail = normalizeEmail(email);
        return normalizedEmail.isBlank()
                ? Optional.empty()
                : userRepository.findByEmailIgnoreCase(normalizedEmail);
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public User updateUser(Long id, UserDTO userDTO) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (userDTO.getFirstName() != null) {
            user.setFirstName(userDTO.getFirstName());
        }
        if (userDTO.getLastName() != null) {
            user.setLastName(userDTO.getLastName());
        }
        if (userDTO.getBio() != null) {
            user.setBio(userDTO.getBio());
        }
        if (userDTO.getProfilePictureUrl() != null) {
            user.setProfilePictureUrl(userDTO.getProfilePictureUrl());
        }

        return userRepository.save(user);
    }

    public UserDTO convertToDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setUsername(user.getUsername());
        dto.setName(buildDisplayName(user));
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setBio(user.getBio());
        dto.setProfilePictureUrl(user.getProfilePictureUrl());
        dto.setIsActive(user.getIsActive());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        return dto;
    }

    private String buildDisplayName(User user) {
        String firstName = normalizeNullableName(user.getFirstName());
        String lastName = normalizeNullableName(user.getLastName());
        if (firstName != null && lastName != null) {
            return firstName + " " + lastName;
        }
        if (firstName != null) {
            return firstName;
        }
        if (lastName != null) {
            return lastName;
        }
        return user.getUsername();
    }

    public Optional<User> findOrCreateOAuthUser(String oauthId, String oauthProvider, String email, String name) {
        Optional<User> existingUser = userRepository.findByOauthIdAndOauthProvider(oauthId, oauthProvider);
        if (existingUser.isPresent()) {
            return existingUser;
        }

        String normalizedEmail = normalizeEmail(email);
        if (normalizedEmail.isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }

        // Check if email already exists
        Optional<User> emailUser = userRepository.findByEmailIgnoreCase(normalizedEmail);
        if (emailUser.isPresent()) {
            User user = emailUser.get();
            user.setOauthId(oauthId);
            user.setOauthProvider(oauthProvider);
            return Optional.of(userRepository.save(user));
        }

        String uniqueUsername = makeUniqueUsername(name, normalizedEmail);

        // Create new user
        User user = new User();
        user.setEmail(normalizedEmail);
        user.setOauthId(oauthId);
        user.setOauthProvider(oauthProvider);
        user.setOauthEmail(normalizedEmail);
        user.setOauthName(normalizeNullableName(name));
        user.setUsername(uniqueUsername);
        user.setIsActive(true);

        user = userRepository.save(user);

        // Create default preferences
        UserPreferences preferences = new UserPreferences();
        preferences.setUser(user);
        userPreferencesRepository.save(preferences);

        // Create default profile
        UserProfile profile = new UserProfile();
        profile.setUser(user);
        profile.setUsername(uniqueUsername);
        profile.setIsPublic(false);
        userProfileRepository.save(profile);

        return Optional.of(user);
    }
}
