package com.eventtracker;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;

import java.util.concurrent.atomic.AtomicBoolean;

@Slf4j
@SpringBootApplication
public class EventAppTrackerApplication {

    private static final long PROCESS_START_TIME = System.currentTimeMillis();
    private static final AtomicBoolean FIRST_REQUEST_LOGGED = new AtomicBoolean(false);

    public static void main(String[] args) {
        log.info("[Startup Timing] +0ms: JVM main() entered.");
        SpringApplication.run(EventAppTrackerApplication.class, args);
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        long elapsed = System.currentTimeMillis() - PROCESS_START_TIME;
        log.info("[Startup Timing] +{}ms: Spring Boot ApplicationReadyEvent - Server listening on port.", elapsed);
    }

    public static void logFirstRequest(String method, String uri) {
        if (FIRST_REQUEST_LOGGED.compareAndSet(false, true)) {
            long elapsed = System.currentTimeMillis() - PROCESS_START_TIME;
            log.info("[Startup Timing] +{}ms: First HTTP request received: {} {}", elapsed, method, uri);
        }
    }
}