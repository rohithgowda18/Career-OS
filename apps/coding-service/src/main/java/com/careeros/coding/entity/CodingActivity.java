package com.careeros.coding.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "coding_activity", uniqueConstraints = {
        @UniqueConstraint(name = "uq_account_activity_date", columnNames = {"coding_account_id", "activity_date"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CodingActivity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coding_account_id", nullable = false)
    private CodingAccount account;

    @Column(name = "activity_date", nullable = false)
    private LocalDate activityDate;

    @Column(name = "problems_solved", nullable = false)
    private int problemsSolved;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
