package com.eventtracker.controller;

import com.eventtracker.dto.AuthDTO.LoginRequest;
import com.eventtracker.dto.AuthDTO.RegisterRequest;
import com.eventtracker.dto.AuthDTO.AuthResponse;
import com.eventtracker.entity.User;
import com.eventtracker.exception.DuplicateUserException;
import com.eventtracker.security.JwtTokenProvider;
import com.eventtracker.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final JwtTokenProvider tokenProvider;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/register")
    @Operation(operationId = "register", summary = "Register a new user")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            User user = userService.createUser(
                    request.getEmail(),
                    request.getPassword()
            );

            String token = tokenProvider.generateToken(user.getId(), user.getEmail());

            return ResponseEntity.status(HttpStatus.CREATED).body(new AuthResponse(
                    token,
                    tokenProvider.getJwtExpirationMillis(),
                    userService.convertToDTO(user)
            ));
        } catch (DuplicateUserException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(errorBody(HttpStatus.CONFLICT, e.getMessage()));
        } catch (Exception e) {
            log.error("Registration error", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(errorBody(HttpStatus.INTERNAL_SERVER_ERROR, "Registration failed"));
        }
    }

    @PostMapping("/login")
    @Operation(operationId = "login", summary = "Login to obtain JWT token")
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
    @Operation(operationId = "getCurrentUser", summary = "Get current authenticated user info")
    public ResponseEntity<?> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            Object principal = authentication.getPrincipal();
            if (principal instanceof User) {
                User user = (User) principal;
                return ResponseEntity.ok(userService.convertToDTO(user));
            }
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    @PostMapping("/logout")
    @Operation(operationId = "logout", summary = "Logout current user session")
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

    private Map<String, Object> errorBody(HttpStatus status, String message) {
        Map<String, Object> body = new HashMap<>();
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("message", message);
        return body;
    }
}
