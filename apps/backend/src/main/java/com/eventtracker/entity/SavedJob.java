package com.eventtracker.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "saved_jobs", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "external_job_id"})
})
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

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "company", nullable = false)
    private String company;

    @Column(name = "location")
    private String location;

    @Column(name = "job_type")
    private String jobType;

    @Column(name = "experience")
    private String experience;

    @Column(name = "work_mode")
    private String workMode;

    @Column(name = "source")
    private String source;

    @Column(name = "apply_url", nullable = false, columnDefinition = "TEXT")
    private String applyUrl;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "skills", columnDefinition = "TEXT")
    private String skills;

    @Column(name = "posted_at")
    private String postedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
