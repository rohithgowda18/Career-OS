package com.careeros.job.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobSearchRequest {
    private String keyword;
    private String location;
    private String jobType;         // e.g. "internship", "full_time"
    private String experienceLevel;  // e.g. "fresher", "entry_level"
    private String workMode;        // e.g. "remote", "hybrid", "onsite"
    private Integer days;           // e.g. 7, 30, 365
    @Builder.Default
    private int page = 0;
    @Builder.Default
    private int size = 10;
}
