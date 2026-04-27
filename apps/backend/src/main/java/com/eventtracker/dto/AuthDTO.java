package com.eventtracker.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

/**
 * Container class for authentication DTOs
 */
public class AuthDTO {
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoginRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Email should be valid")
        private String email;

        @NotBlank(message = "Password is required")
        @Size(max = 128, message = "Password must be 128 characters or fewer")
        private String password;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RegisterRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Email should be valid")
        private String email;

        @NotBlank(message = "Password is required")
        @Size(min = 6, max = 128, message = "Password must be between 6 and 128 characters")
        private String password;

        @Size(max = 120, message = "Name must be 120 characters or fewer")
        private String name;

        @Size(max = 60, message = "First name must be 60 characters or fewer")
        private String firstName;

        @Size(max = 60, message = "Last name must be 60 characters or fewer")
        private String lastName;

        @NotBlank(message = "Username is required")
        @Size(max = 40, message = "Username must be 40 characters or fewer")
        private String username;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class AuthResponse {
        private String token;
        private Long expiresIn;
        private UserDTO user;
    }
}
