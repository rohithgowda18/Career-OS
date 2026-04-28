package com.eventtracker;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.admin.SpringApplicationAdminJmxAutoConfiguration;
import org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration;
import org.springframework.boot.autoconfigure.jmx.JmxAutoConfiguration;
import org.springframework.boot.autoconfigure.mail.MailSenderAutoConfiguration;
import org.springframework.boot.autoconfigure.mail.MailSenderValidatorAutoConfiguration;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(exclude = {
        // Mail: even with mail.enabled=false, auto-config attempts SMTP DNS resolution at startup
        MailSenderAutoConfiguration.class,
        MailSenderValidatorAutoConfiguration.class,
        // Flyway: already disabled in yml; exclusion prevents class scanning entirely
        FlywayAutoConfiguration.class,
        // JMX: registers MBeans on startup — unnecessary overhead on Render free tier
        JmxAutoConfiguration.class,
        // Admin JMX: Spring Boot Admin JMX beans, not used
        SpringApplicationAdminJmxAutoConfiguration.class,
        // Unused features to reduce scanning
        org.springframework.boot.autoconfigure.websocket.servlet.WebSocketServletAutoConfiguration.class,
        org.springframework.boot.autoconfigure.batch.BatchAutoConfiguration.class
})
@EnableScheduling
public class EventAppTrackerApplication {

    public static void main(String[] args) {
        SpringApplication.run(EventAppTrackerApplication.class, args);
    }
}
