package com.eventtracker.coding.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "coding_stats_history",
    indexes = {
        @Index(name = "idx_coding_stats_history_account_id", columnList = "coding_account_id")
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CodingStatsHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coding_account_id", nullable = false)
    private CodingAccount account;

    @Column(name = "total_solved", nullable = false)
    @Builder.Default
    private int totalSolved = 0;

    @Column(name = "easy_solved", nullable = false)
    @Builder.Default
    private int easySolved = 0;

    @Column(name = "medium_solved", nullable = false)
    @Builder.Default
    private int mediumSolved = 0;

    @Column(name = "hard_solved", nullable = false)
    @Builder.Default
    private int hardSolved = 0;

    @Column(name = "rating")
    private Double rating;

    @CreationTimestamp
    @Column(name = "recorded_at", nullable = false, updatable = false)
    private LocalDateTime recordedAt;
}
