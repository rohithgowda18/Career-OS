package com.eventtracker.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Entity
@Table(name = "event_success_scores", uniqueConstraints = {@UniqueConstraint(columnNames = {"application_id", "user_id"})})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EventSuccessScore {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id", nullable = false)
    private Application application;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "success_probability", nullable = false)
    private Double successProbability;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "score_factors", nullable = false, columnDefinition = "jsonb")
    private String scoreFactors;

    @CreationTimestamp
    @Column(name = "calculated_at", nullable = false, updatable = false)
    private LocalDateTime calculatedAt;
}
