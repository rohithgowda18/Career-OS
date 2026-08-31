package com.eventtracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobDTO {
    private String externalJobId;
    private String title;
    private String company;
    private String location;
    private String jobType;         // e.g. "Full-time", "Internship", "Contract"
    private String experienceLevel;  // e.g. "Fresher", "0-1 years", "1-3 years"
    private String workMode;        // e.g. "Remote", "Hybrid", "On-site"
    private String source;          // e.g. "Adzuna"
    private String applyUrl;        // Direct external application URL
    private String description;     // Summary/Description
    private String postedAt;        // e.g. "2026-08-30" or relative
    private String salary;          // e.g. "₹6,00,000 - ₹10,00,000" or formatted range
    private List<String> skills;
    private boolean saved;          // True if saved by the authenticated user
    private Long savedJobId;        // Local ID if saved
}
