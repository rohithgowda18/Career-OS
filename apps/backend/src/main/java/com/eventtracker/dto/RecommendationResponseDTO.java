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
public class RecommendationResponseDTO {
    private String eventName;
    private String eventType;
    private Double matchScore;
    private List<String> reasons;
    private List<String> skillGaps;
    private String bestTimeToApply;
    private List<String> tips;
}
