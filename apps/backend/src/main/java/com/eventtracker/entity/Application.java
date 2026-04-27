package com.eventtracker.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "applications")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Application {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "event_name", nullable = false)
    private String eventName;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false)
    private EventType eventType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ApplicationStatus status;

    @Column(name = "deadline")
    private LocalDateTime deadline;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "event_url")
    private String url;

    @Column(name = "success_score")
    private Double successScore;

    @Column(name = "is_favorite")
    private Boolean isFavorite = false;

    @Column(name = "rejection_reason")
    private String rejectionReason;

    @Column(name = "application_link")
    private String applicationLink;

    @Column(name = "tags")
    private String tags;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public enum EventType {
        Hackathon, Workshop, Conference, Other
    }

    public enum ApplicationStatus {
        Interested, Applied, UnderReview, Accepted, Rejected, Withdrawn
    }
}
