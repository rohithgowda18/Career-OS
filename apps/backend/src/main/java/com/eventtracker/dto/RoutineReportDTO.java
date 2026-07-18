package com.eventtracker.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoutineReportDTO {
    private Map<String, Double> weeklyCompletion;
    private double weeklyAverage;
    private int currentStreak;
    private int longestStreak;
    private String bestDay;
}
