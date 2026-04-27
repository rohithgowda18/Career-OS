package com.eventtracker.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "user_preferences")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserPreferences {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User user;

    @Column(name = "email_notifications")
    private Boolean emailNotifications = true;

    @Column(name = "deadline_reminders")
    private Boolean deadlineReminders = true;

    @Column(name = "digest_frequency")
    private String digestFrequency = "weekly";

    @Column(name = "preferred_event_types")
    private String preferredEventTypes;

    @Column(name = "timezone")
    private String timezone = "UTC";

    @Column(name = "theme")
    private String theme = "light";

    @Column(name = "language")
    private String language = "en";

    @Column(name = "receive_recommendations")
    private Boolean receiveRecommendations = true;
}
