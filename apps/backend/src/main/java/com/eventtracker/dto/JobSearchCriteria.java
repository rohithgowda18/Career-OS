package com.eventtracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobSearchCriteria {
    private String keyword;
    private String location;
    private String jobType;         // e.g. "internship", "full_time"
    private String experienceLevel;  // e.g. "fresher", "entry_level"
    private String workMode;        // e.g. "remote", "hybrid", "onsite"
    private String company;
    private String sortBy;          // e.g. "date", "relevance"
    @Builder.Default
    private int page = 0;
    @Builder.Default
    private int size = 10;
}
