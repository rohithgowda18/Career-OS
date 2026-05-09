package com.eventtracker.service;

import com.eventtracker.dto.UserDTO;
import com.eventtracker.entity.User;
import com.eventtracker.entity.UserProfile;
import com.eventtracker.exception.DuplicateUserException;
import com.eventtracker.repository.UserRepository;
import com.eventtracker.repository.UserProfileRepository;
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
    private final PasswordEncoder passwordEncoder;

    public User createUser(String email, String password) {
        String normalizedEmail = normalizeEmail(email);
        
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new DuplicateUserException("Email already exists");
        }

        String encodedPassword = passwordEncoder.encode(password);

        User user = new User();
        user.setEmail(normalizedEmail);
        user.setPassword(encodedPassword);
        user.setRole("USER");

        user = userRepository.save(user);

        // Create default profile
        UserProfile profile = new UserProfile();
        profile.setUser(user);
        userProfileRepository.save(profile);

        return user;
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
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

    public UserDTO convertToDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        return dto;
    }
}
