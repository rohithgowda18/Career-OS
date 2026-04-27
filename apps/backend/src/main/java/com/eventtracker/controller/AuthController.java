package com.eventtracker.controller;

import com.eventtracker.dto.AuthDTO.LoginRequest;
import com.eventtracker.dto.AuthDTO.RegisterRequest;
import com.eventtracker.dto.AuthDTO.AuthResponse;
import com.eventtracker.dto.UserDTO;
import com.eventtracker.entity.User;
import com.eventtracker.security.JwtTokenProvider;
import com.eventtracker.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@CrossOrigin
public class AuthController {

    private final UserService userService;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            User user = userService.createUser(
                    request.getEmail(),
                    request.getPassword(),
                    request.getFirstName(),
                    request.getLastName(),
                    request.getUsername()
            );

            String token = tokenProvider.generateToken(user.getId(), user.getEmail());

            return ResponseEntity.status(HttpStatus.CREATED).body(new AuthResponse(
                    token,
                    tokenProvider.getJwtExpirationMillis(),
                    userService.convertToDTO(user)
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            Optional<User> user = userService.findByEmail(request.getEmail());
            if (user.isEmpty() || !passwordEncoder.matches(request.getPassword(), user.get().getPassword())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
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
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Login failed");
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
}
