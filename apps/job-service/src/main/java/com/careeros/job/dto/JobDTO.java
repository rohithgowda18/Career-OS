package com.careeros.job.dto;

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
    private String experienceLevel;  // e.g. "Fresher", "Entry Level", "Senior"
    private String workMode;        // e.g. "Remote", "Hybrid", "On-site"
    private String source;          // "Jobvetta"
    private String applyUrl;        // Official external application URL
    private String description;     // Description / Summary
    private String postedAt;        // Creation date
    private String salary;          // Salary formatted string if provided
    private List<String> skills;    // Skills required
}
