package com.eventtracker;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
public class EventAppTrackerApplication {
    public static void main(String[] args) {
        SpringApplication.run(EventAppTrackerApplication.class, args);
    }
}