package com.eventtracker.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {
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

    @Size(max = 40, message = "Username must be 40 characters or fewer")
    private String username;
}
