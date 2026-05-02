package com.eventtracker.service;

import com.eventtracker.dto.ApplicationDTO;
import com.eventtracker.entity.Application;
import com.eventtracker.entity.User;
import com.eventtracker.exception.DuplicateEventException;
import com.eventtracker.repository.ApplicationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ApplicationService {
    private final ApplicationRepository applicationRepository;

    public Application createApplication(User user, ApplicationDTO dto) {
        String normalizedUrl = normalizeUrl(dto.getUrl());
        
        // Check for duplicates
        if (normalizedUrl != null) {
            applicationRepository.findByUserIdAndUrl(user.getId(), normalizedUrl)
                .ifPresent(app -> {
                    throw new DuplicateEventException("Event already saved in your tracker");
                });
        }

        Application app = new Application();
        app.setUser(user);
        app.setEventName(dto.getEventName());
        app.setEventType(Application.EventType.valueOf(dto.getEventType()));
        app.setStatus(Application.ApplicationStatus.valueOf(dto.getStatus().replaceAll(" ", "")));
        app.setDeadline(dto.getDeadline());
        app.setNotes(dto.getNotes());
        app.setUrl(normalizedUrl);
        app.setLocation(dto.getLocation());

        return applicationRepository.save(app);
    }

    private String normalizeUrl(String url) {
        if (url == null || url.isBlank()) return null;
        
        String normalized = url.trim().toLowerCase();
        
        // Remove tracking params (?utm=...)
        int queryIndex = normalized.indexOf('?');
        if (queryIndex != -1) {
            normalized = normalized.substring(0, queryIndex);
        }
        
        // Remove trailing slash
        if (normalized.endsWith("/")) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }
        
        return normalized;
    }

    public Optional<Application> findById(Long id, Long userId) {
        return applicationRepository.findByIdAndUserId(id, userId);
    }

    public List<ApplicationDTO> getUserApplications(Long userId) {
        return applicationRepository.findByUserIdOrderByDeadlineAsc(userId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<ApplicationDTO> getUserApplicationsByStatus(Long userId, String status) {
        Application.ApplicationStatus appStatus = Application.ApplicationStatus.valueOf(status.replaceAll(" ", ""));
        return applicationRepository.findByUserIdAndStatusOrderByDeadlineAsc(userId, appStatus)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public Application updateApplication(Long id, Long userId, ApplicationDTO dto) {
        Application app = applicationRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));

        if (dto.getEventName() != null) {
            app.setEventName(dto.getEventName());
        }
        if (dto.getEventType() != null) {
            app.setEventType(Application.EventType.valueOf(dto.getEventType()));
        }
        if (dto.getStatus() != null) {
            app.setStatus(Application.ApplicationStatus.valueOf(dto.getStatus().replaceAll(" ", "")));
        }
        if (dto.getDeadline() != null) {
            app.setDeadline(dto.getDeadline());
        }
        if (dto.getNotes() != null) {
            app.setNotes(dto.getNotes());
        }
        if (dto.getUrl() != null) {
            app.setUrl(dto.getUrl());
        }
        if (dto.getLocation() != null) {
            app.setLocation(dto.getLocation());
        }

        return applicationRepository.save(app);
    }

    public void deleteApplication(Long id, Long userId) {
        Application app = applicationRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));
        applicationRepository.delete(app);
    }

    public ApplicationDTO convertToDTO(Application app) {
        ApplicationDTO dto = new ApplicationDTO();
        dto.setId(app.getId());
        dto.setEventName(app.getEventName());
        dto.setEventType(app.getEventType().toString());
        dto.setStatus(app.getStatus().toString());
        dto.setDeadline(app.getDeadline());
        dto.setNotes(app.getNotes());
        dto.setUrl(app.getUrl());
        dto.setLocation(app.getLocation());
        dto.setCreatedAt(app.getCreatedAt());
        dto.setUpdatedAt(app.getUpdatedAt());
        return dto;
    }

    public Application convertFromDTO(ApplicationDTO dto) {
        Application app = new Application();
        app.setEventName(dto.getEventName());
        app.setEventType(Application.EventType.valueOf(dto.getEventType()));
        app.setStatus(Application.ApplicationStatus.valueOf(dto.getStatus().replaceAll(" ", "")));
        app.setDeadline(dto.getDeadline());
        app.setNotes(dto.getNotes());
        app.setUrl(dto.getUrl());
        app.setLocation(dto.getLocation());
        return app;
    }

    public List<ApplicationDTO> getUserApplicationsByEventType(Long userId, String eventType) {
        Application.EventType type = Application.EventType.valueOf(eventType);
        return applicationRepository.findByUserIdAndEventTypeOrderByDeadlineAsc(userId, type)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public long countUserApplications(Long userId) {
        return applicationRepository.countByUserId(userId);
    }

    public long countUserApplicationsByStatus(Long userId, String status) {
        Application.ApplicationStatus appStatus = Application.ApplicationStatus.valueOf(status.replaceAll(" ", ""));
        return applicationRepository.countByUserIdAndStatus(userId, appStatus);
    }
}
