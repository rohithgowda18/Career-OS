package com.careeros.coding.dto;

import com.careeros.coding.model.Platform;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyActivityDTO {
    private LocalDate date;
    private int totalSolved;
    private Map<Platform, Integer> breakdown;
}
