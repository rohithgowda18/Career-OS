package com.eventtracker.service;

import com.eventtracker.entity.User;
import com.eventtracker.entity.UserPreferences;
import com.eventtracker.entity.UserProfile;
import com.eventtracker.exception.DuplicateUserException;
import com.eventtracker.repository.UserPreferencesRepository;
import com.eventtracker.repository.UserProfileRepository;
import com.eventtracker.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    @Mock
    private UserPreferencesRepository userPreferencesRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private UserService userService;

    @BeforeEach
    void setUp() {
        userService = new UserService(
                userRepository,
                userProfileRepository,
                userPreferencesRepository,
                passwordEncoder
        );
    }

    @Test
    void createUserSucceedsWhenDatabaseHasNoMatchingUser() {
        when(userRepository.existsByEmailIgnoreCase("ada@example.com")).thenReturn(false);
        when(userRepository.existsByUsernameIgnoreCase("ada")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encoded-password");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(1L);
            return user;
        });
        when(userPreferencesRepository.save(any(UserPreferences.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userProfileRepository.save(any(UserProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User user = userService.createUser("Ada@Example.com", "password123", "Ada", "Lovelace", null);

        assertThat(user.getId()).isEqualTo(1L);
        assertThat(user.getEmail()).isEqualTo("ada@example.com");
        assertThat(user.getOpenId()).isEqualTo("email:ada@example.com");
        assertThat(user.getUsername()).isEqualTo("ada");
        assertThat(user.getPassword()).isEqualTo("encoded-password");
        assertThat(user.getPasswordHash()).isEqualTo("encoded-password");
        assertThat(user.getName()).isEqualTo("Ada Lovelace");
        assertThat(user.getRole()).isEqualTo("USER");
        assertThat(user.getLoginMethod()).isEqualTo("EMAIL");
        assertThat(user.getIsActive()).isTrue();

        verify(userPreferencesRepository).save(any(UserPreferences.class));
        verify(userProfileRepository).save(any(UserProfile.class));
    }

    @Test
    void createUserRejectsDuplicateEmail() {
        when(userRepository.existsByEmailIgnoreCase("ada@example.com")).thenReturn(true);

        assertThatThrownBy(() -> userService.createUser(
                "ada@example.com",
                "password123",
                "Ada",
                "Lovelace",
                null
        ))
                .isInstanceOf(DuplicateUserException.class)
                .hasMessage("Email already exists");
    }

    @Test
    void createUserRejectsDuplicateRequestedUsername() {
        when(userRepository.existsByEmailIgnoreCase("ada@example.com")).thenReturn(false);
        when(userRepository.existsByUsernameIgnoreCase("ada")).thenReturn(true);

        assertThatThrownBy(() -> userService.createUser(
                "ada@example.com",
                "password123",
                "Ada",
                "Lovelace",
                "Ada"
        ))
                .isInstanceOf(DuplicateUserException.class)
                .hasMessage("Username already exists");
    }
}
