package com.eventtracker.service;

import com.eventtracker.dto.ApplicationDTO;
import com.eventtracker.entity.Application;
import com.eventtracker.entity.User;
import com.eventtracker.exception.DuplicateEventException;
import com.eventtracker.repository.ApplicationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.eventtracker.util.UrlUtils;

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
        String normalizedUrl = UrlUtils.normalizeUrl(dto.getUrl());
        
        if (normalizedUrl != null) {
            applicationRepository.findByUserIdAndUrl(user.getId(), normalizedUrl)
                .ifPresent(app -> {
                    throw new DuplicateEventException("Event already saved in your tracker");
                });
        }

        Application app = new Application();
        app.setUser(user);
        app.setEventName(dto.getEventName());
        app.setEventType(parseEventType(dto.getEventType()));
        app.setStatus(parseStatus(dto.getStatus()));
        app.setDeadline(dto.getDeadline());
        app.setNotes(dto.getNotes());
        app.setUrl(normalizedUrl);
        app.setLocation(dto.getLocation());

        return applicationRepository.save(app);
    }

    private Application.EventType parseEventType(String eventType) {
        if (eventType == null) return Application.EventType.Other;
        String normalized = eventType.trim().replaceAll(" ", "");
        for (Application.EventType type : Application.EventType.values()) {
            if (type.name().equalsIgnoreCase(normalized)) return type;
        }
        return Application.EventType.Other;
    }

    private Application.ApplicationStatus parseStatus(String status) {
        if (status == null) return Application.ApplicationStatus.Interested;
        String normalized = status.trim().replaceAll(" ", "");
        for (Application.ApplicationStatus appStatus : Application.ApplicationStatus.values()) {
            if (appStatus.name().equalsIgnoreCase(normalized)) return appStatus;
        }
        return Application.ApplicationStatus.Interested;
    }


    public Optional<Application> findById(Long id, Long userId) {
        return applicationRepository.findByIdAndUserId(id, userId);
    }

    public Page<ApplicationDTO> getUserApplications(Long userId, String status, String search, Pageable pageable) {
        Application.ApplicationStatus appStatus = null;
        if (status != null && !status.trim().isEmpty() && !status.equalsIgnoreCase("ALL")) {
            appStatus = parseStatus(status);
        }
        String searchPattern = (search != null && !search.trim().isEmpty()) ? search.trim() : null;

        return applicationRepository.findFiltered(userId, appStatus, searchPattern, pageable)
                .map(this::convertToDTO);
    }

    public List<ApplicationDTO> getUserApplicationsByStatus(Long userId, String status) {
        Application.ApplicationStatus appStatus = parseStatus(status);
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
            app.setEventType(parseEventType(dto.getEventType()));
        }
        if (dto.getStatus() != null) {
            app.setStatus(parseStatus(dto.getStatus()));
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
        app.setEventType(parseEventType(dto.getEventType()));
        app.setStatus(parseStatus(dto.getStatus()));
        app.setDeadline(dto.getDeadline());
        app.setNotes(dto.getNotes());
        app.setUrl(dto.getUrl());
        app.setLocation(dto.getLocation());
        return app;
    }

    public List<ApplicationDTO> getUserApplicationsByEventType(Long userId, String eventType) {
        Application.EventType type = parseEventType(eventType);
        return applicationRepository.findByUserIdAndEventTypeOrderByDeadlineAsc(userId, type)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public long countUserApplications(Long userId) {
        return applicationRepository.countByUserId(userId);
    }

    public long countUserApplicationsByStatus(Long userId, String status) {
        Application.ApplicationStatus appStatus = parseStatus(status);
        return applicationRepository.countByUserIdAndStatus(userId, appStatus);
    }
}
