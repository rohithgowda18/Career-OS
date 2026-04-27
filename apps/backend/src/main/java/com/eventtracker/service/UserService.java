package com.eventtracker.service;

import com.eventtracker.dto.UserDTO;
import com.eventtracker.entity.User;
import com.eventtracker.entity.UserProfile;
import com.eventtracker.entity.UserPreferences;
import com.eventtracker.repository.UserRepository;
import com.eventtracker.repository.UserProfileRepository;
import com.eventtracker.repository.UserPreferencesRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already exists");
        }

        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setUsername(username);
        user.setIsActive(true);

        user = userRepository.save(user);

        // Create default preferences
        UserPreferences preferences = new UserPreferences();
        preferences.setUser(user);
        userPreferencesRepository.save(preferences);

        // Create default profile
        UserProfile profile = new UserProfile();
        profile.setUser(user);
        profile.setUsername(username);
        profile.setIsPublic(false);
        userProfileRepository.save(profile);

        return user;
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
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
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setBio(user.getBio());
        dto.setProfilePictureUrl(user.getProfilePictureUrl());
        dto.setIsActive(user.getIsActive());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        return dto;
    }

    public Optional<User> findOrCreateOAuthUser(String oauthId, String oauthProvider, String email, String name) {
        Optional<User> existingUser = userRepository.findByOauthIdAndOauthProvider(oauthId, oauthProvider);
        if (existingUser.isPresent()) {
            return existingUser;
        }

        // Check if email already exists
        Optional<User> emailUser = userRepository.findByEmail(email);
        if (emailUser.isPresent()) {
            User user = emailUser.get();
            user.setOauthId(oauthId);
            user.setOauthProvider(oauthProvider);
            return Optional.of(userRepository.save(user));
        }

        // Create new user
        User user = new User();
        user.setEmail(email);
        user.setOauthId(oauthId);
        user.setOauthProvider(oauthProvider);
        user.setOauthEmail(email);
        user.setOauthName(name);
        user.setIsActive(true);

        user = userRepository.save(user);

        // Create default preferences
        UserPreferences preferences = new UserPreferences();
        preferences.setUser(user);
        userPreferencesRepository.save(preferences);

        // Create default profile
        UserProfile profile = new UserProfile();
        profile.setUser(user);
        profile.setIsPublic(false);
        userProfileRepository.save(profile);

        return Optional.of(user);
    }
}
