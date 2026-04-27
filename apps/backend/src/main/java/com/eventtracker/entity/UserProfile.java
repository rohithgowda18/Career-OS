package com.eventtracker.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User user;

    private String username;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(name = "profile_picture_url")
    private String profilePictureUrl;

    @Column(name = "github_url")
    private String githubUrl;

    @Column(name = "linkedin_url")
    private String linkedinUrl;

    @Column(name = "portfolio_url")
    private String portfolioUrl;

    @Column(name = "twitter_handle")
    private String twitterHandle;

    @Column(name = "total_applications")
    private Integer totalApplications = 0;

    @Column(name = "successful_applications")
    private Integer successfulApplications = 0;

    @Column(name = "success_rate")
    private Double successRate = 0.0;

    @Column(name = "is_public")
    private Boolean isPublic = false;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "skills_json", columnDefinition = "jsonb")
    private String skillsJson;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "interests", columnDefinition = "jsonb")
    private String interests;

    @Column(name = "experience_level")
    private String experienceLevel = "intermediate";

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "preferred_event_types", columnDefinition = "jsonb")
    private String preferredEventTypes;

    private String location;

    private String timezone;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
