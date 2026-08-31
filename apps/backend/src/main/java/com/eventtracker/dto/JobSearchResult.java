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
public class JobSearchResult {
    private List<JobDTO> content;
    private long totalElements;
    private int totalPages;
    private int currentPage;
    private int size;
    private String source;
}
