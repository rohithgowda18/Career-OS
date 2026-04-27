package com.eventtracker.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ScheduledTasks {

    private final DigestService digestService;

    // Run every Monday at 9:00 AM
    @Scheduled(cron = "0 0 9 * * MON")
    public void scheduleWeeklyDigest() {
        log.info("Starting scheduled weekly digest process...");
        digestService.processAllWeeklyDigests();
        log.info("Weekly digest process completed.");
    }

    // Run daily at 10:00 AM for deadline reminders
    @Scheduled(cron = "0 0 10 * * *")
    public void scheduleDeadlineReminders() {
        log.info("Starting daily deadline reminders check...");
        // Placeholder for future reminder logic if needed
        log.info("Daily reminders check completed.");
    }
}
