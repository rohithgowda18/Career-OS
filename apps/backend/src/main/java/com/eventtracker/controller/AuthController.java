package com.eventtracker.controller;

import com.eventtracker.dto.AuthDTO.LoginRequest;
import com.eventtracker.dto.AuthDTO.RegisterRequest;
import com.eventtracker.dto.AuthDTO.AuthResponse;
import com.eventtracker.dto.UserDTO;
import com.eventtracker.entity.User;
import com.eventtracker.exception.DuplicateUserException;
import com.eventtracker.security.JwtTokenProvider;
import com.eventtracker.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.core.NestedExceptionUtils;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@CrossOrigin
public class AuthController {

    private final UserService userService;
    private final JwtTokenProvider tokenProvider;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            NameParts nameParts = resolveNameParts(request);
            User user = userService.createUser(
                    request.getEmail(),
                    request.getPassword(),
                    nameParts.firstName(),
                    nameParts.lastName(),
                    request.getUsername()
            );

            String token = tokenProvider.generateToken(user.getId(), user.getEmail());

            return ResponseEntity.status(HttpStatus.CREATED).body(new AuthResponse(
                    token,
                    tokenProvider.getJwtExpirationMillis(),
                    userService.convertToDTO(user)
            ));
        } catch (DuplicateUserException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(errorBody(HttpStatus.CONFLICT, e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorBody(HttpStatus.BAD_REQUEST, e.getMessage()));
        } catch (DataIntegrityViolationException e) {
            if (isUserUniqueConstraintViolation(e)) {
                log.warn("Registration rejected because of duplicate persisted user data", e);
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(errorBody(HttpStatus.CONFLICT, "Email or username already exists"));
            }
            log.error("Registration failed because persisted user data violated a non-duplicate constraint", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(errorBody(HttpStatus.INTERNAL_SERVER_ERROR, "Registration failed"));
        } catch (Exception e) {
            log.error("Registration error", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(errorBody(HttpStatus.INTERNAL_SERVER_ERROR, "Registration failed"));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            Optional<User> user = userService.findByEmail(request.getEmail());
            if (user.isEmpty() || !passwordEncoder.matches(request.getPassword(), user.get().getPassword())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(errorBody(HttpStatus.UNAUTHORIZED, "Invalid email or password"));
            }

            User authenticatedUser = user.get();
            String token = tokenProvider.generateToken(authenticatedUser.getId(), authenticatedUser.getEmail());

            return ResponseEntity.ok(new AuthResponse(
                    token,
                    tokenProvider.getJwtExpirationMillis(),
                    userService.convertToDTO(authenticatedUser)
            ));
        } catch (Exception e) {
            log.error("Login error", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(errorBody(HttpStatus.INTERNAL_SERVER_ERROR, "Login failed"));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            Object principal = authentication.getPrincipal();
            if (principal instanceof User) {
                User user = (User) principal;
                log.info("Getting current user: {}", user.getEmail());
                return ResponseEntity.ok(userService.convertToDTO(user));
            }
        }
        log.warn("No authenticated user found");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request) {
        SecurityContextHolder.clearContext();
        return ResponseEntity.ok("Logout successful");
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationErrors(MethodArgumentNotValidException ex) {
        Map<String, Object> errors = new HashMap<>();
        String firstMessage = "Validation failed";
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            errors.put(error.getField(), error.getDefaultMessage());
            if ("Validation failed".equals(firstMessage)) {
                firstMessage = error.getDefaultMessage();
            }
        }
        errors.put("status", HttpStatus.BAD_REQUEST.value());
        errors.put("error", HttpStatus.BAD_REQUEST.getReasonPhrase());
        errors.put("message", firstMessage);
        return ResponseEntity.badRequest().body(errors);
    }

    private NameParts resolveNameParts(RegisterRequest request) {
        String firstName = trimToNull(request.getFirstName());
        String lastName = trimToNull(request.getLastName());
        String fullName = trimToNull(request.getName());

        if ((firstName == null || firstName.isBlank()) && fullName != null) {
            String[] pieces = fullName.split("\\s+", 2);
            firstName = pieces[0];
            lastName = pieces.length > 1 ? pieces[1] : lastName;
        }

        return new NameParts(firstName, lastName);
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private Map<String, Object> errorBody(HttpStatus status, String message) {
        Map<String, Object> body = new HashMap<>();
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("message", message);
        return body;
    }

    private boolean isUserUniqueConstraintViolation(DataIntegrityViolationException exception) {
        Throwable rootCause = NestedExceptionUtils.getMostSpecificCause(exception);
        String message = rootCause == null ? exception.getMessage() : rootCause.getMessage();
        if (message == null) {
            return false;
        }

        String normalizedMessage = message.toLowerCase();
        return normalizedMessage.contains("users_email_key")
                || normalizedMessage.contains("users_username_key")
                || normalizedMessage.contains("uk_users_email")
                || normalizedMessage.contains("uk_users_username");
    }

    private record NameParts(String firstName, String lastName) {
    }
}
