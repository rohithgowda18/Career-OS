package com.eventtracker.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "calendar_conflicts")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CalendarConflict {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id_1", nullable = false)
    private Application application1;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id_2", nullable = false)
    private Application application2;

    @Column(name = "conflict_date_start", nullable = false)
    private LocalDateTime conflictDateStart;

    @Column(name = "conflict_date_end", nullable = false)
    private LocalDateTime conflictDateEnd;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recommended_application_id")
    private Application recommendedApplication;

    @Column(name = "is_resolved", nullable = false)
    private Boolean isResolved = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
