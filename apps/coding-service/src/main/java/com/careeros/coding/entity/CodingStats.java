package com.careeros.coding.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "coding_stats",
    indexes = {
        @Index(name = "idx_coding_stats_account_id", columnList = "coding_account_id")
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CodingStats {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coding_account_id", nullable = false, unique = true)
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

    @Column(name = "current_streak")
    private Integer currentStreak;

    @UpdateTimestamp
    @Column(name = "synced_at", nullable = false)
    private LocalDateTime syncedAt;
}
