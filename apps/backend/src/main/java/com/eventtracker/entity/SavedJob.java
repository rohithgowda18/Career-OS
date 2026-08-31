package com.eventtracker.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "saved_jobs",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_saved_jobs_user_ext_source", columnNames = {"user_id", "external_job_id", "source"})
    },
    indexes = {
        @Index(name = "idx_saved_jobs_user_id", columnList = "user_id")
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SavedJob {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "external_job_id", nullable = false)
    private String externalJobId;

    @Column(name = "source", nullable = false, length = 100)
    private String source;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
