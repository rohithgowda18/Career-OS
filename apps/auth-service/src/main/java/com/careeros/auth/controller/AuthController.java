package com.careeros.auth.controller;

import com.careeros.auth.dto.AuthDTO.LoginRequest;
import com.careeros.auth.dto.AuthDTO.RegisterRequest;
import com.careeros.auth.dto.AuthDTO.AuthResponse;
import com.careeros.auth.entity.User;
import com.careeros.auth.security.JwtTokenProvider;
import com.careeros.auth.security.UserPrincipal;
import com.careeros.auth.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
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
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        User user = userService.createUser(
                request.getEmail(),
                request.getPassword(),
                request.getDisplayName()
        );

        String token = tokenProvider.generateToken(user.getId(), user.getEmail());

        return ResponseEntity.status(HttpStatus.CREATED).body(new AuthResponse(
                token,
                tokenProvider.getJwtExpirationMillis(),
                userService.convertToDTO(user)
        ));
    }

    @PutMapping("/me/display-name")
    public ResponseEntity<?> updateDisplayName(@RequestBody Map<String, String> body) {
        String displayName = body.get("displayName");
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            Object principal = authentication.getPrincipal();
            Long userId = null;
            if (principal instanceof UserPrincipal) {
                userId = ((UserPrincipal) principal).getId();
            } else if (principal instanceof User) {
                userId = ((User) principal).getId();
            }
            if (userId != null) {
                User updatedUser = userService.updateDisplayName(userId, displayName);
                if (principal instanceof User) {
                    ((User) principal).setDisplayName(displayName);
                }
                return ResponseEntity.ok(userService.convertToDTO(updatedUser));
            }
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
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
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            Object principal = authentication.getPrincipal();
            Long userId = null;
            if (principal instanceof UserPrincipal) {
                userId = ((UserPrincipal) principal).getId();
            } else if (principal instanceof User) {
                userId = ((User) principal).getId();
            }
            if (userId != null) {
                return userService.findById(userId)
                        .map(fullUser -> ResponseEntity.ok(userService.convertToDTO(fullUser)))
                        .orElse(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
            }
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request) {
        SecurityContextHolder.clearContext();
        return ResponseEntity.ok("Logout successful");
    }

    private Map<String, Object> errorBody(HttpStatus status, String message) {
        Map<String, Object> body = new HashMap<>();
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("message", message);
        return body;
    }
}
