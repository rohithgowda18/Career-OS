package com.careeros.coding.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivitySummaryDTO {
    private int year;
    private int totalSolvedInYear;
    private int totalActiveDays;
    private int currentStreak;
    private int maxStreak;
    private List<DailyActivityDTO> dailyActivities;
}
