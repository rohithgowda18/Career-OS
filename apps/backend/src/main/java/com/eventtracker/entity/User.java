package com.eventtracker.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import lombok.ToString;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User implements UserDetails {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(unique = true)
    private String username;

    @Column(name = "open_id")
    private String openId;

    private String name;

    private String password;

    @Column(name = "password_hash")
    private String passwordHash;

    @Column(nullable = false)
    private String role = "USER";

    @Column(name = "login_method", nullable = false)
    private String loginMethod = "EMAIL";

    @Column(name = "oauth_id")
    private String oauthId;

    @Column(name = "oauth_provider")
    private String oauthProvider;

    @Column(name = "oauth_email")
    private String oauthEmail;

    @Column(name = "oauth_name")
    private String oauthName;

    @Column(name = "first_name")
    private String firstName;

    @Column(name = "last_name")
    private String lastName;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(name = "profile_picture_url")
    private String profilePictureUrl;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @JsonIgnore
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Set<Application> applications = new HashSet<>();

    @JsonIgnore
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private UserPreferences preferences;

    @JsonIgnore
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private UserProfile profile;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "last_signed_in")
    private LocalDateTime lastSignedIn;

    @PrePersist
    void onCreate() {
        if (openId == null || openId.isBlank()) {
            openId = email == null || email.isBlank() ? "email:unknown" : "email:" + email;
        }
        if (name == null || name.isBlank()) {
            name = buildName();
        }
        if ((passwordHash == null || passwordHash.isBlank()) && password != null && !password.isBlank()) {
            passwordHash = password;
        }
        if (role == null || role.isBlank()) {
            role = "USER";
        }
        if (loginMethod == null || loginMethod.isBlank()) {
            loginMethod = "EMAIL";
        }
        if (isActive == null) {
            isActive = true;
        }

        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
        if (lastSignedIn == null) {
            lastSignedIn = now;
        }
    }

    @PreUpdate
    void onUpdate() {
        if (openId == null || openId.isBlank()) {
            openId = email == null || email.isBlank() ? "email:unknown" : "email:" + email;
        }
        if (name == null || name.isBlank()) {
            name = buildName();
        }
        if ((passwordHash == null || passwordHash.isBlank()) && password != null && !password.isBlank()) {
            passwordHash = password;
        }
        if (role == null || role.isBlank()) {
            role = "USER";
        }
        if (loginMethod == null || loginMethod.isBlank()) {
            loginMethod = "EMAIL";
        }
        if (isActive == null) {
            isActive = true;
        }
        updatedAt = LocalDateTime.now();
    }

    private String buildName() {
        String first = firstName == null ? "" : firstName.trim();
        String last = lastName == null ? "" : lastName.trim();
        String fullName = (first + " " + last).trim();
        if (!fullName.isBlank()) {
            return fullName;
        }
        if (username != null && !username.isBlank()) {
            return username;
        }
        return email;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        String normalizedRole = role == null || role.isBlank() ? "USER" : role.toUpperCase();
        return Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + normalizedRole));
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return isActive != null && isActive;
    }
}
