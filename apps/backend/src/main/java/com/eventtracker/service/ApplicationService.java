package com.eventtracker.service;

import com.eventtracker.dto.ApplicationDTO;
import com.eventtracker.entity.Application;
import com.eventtracker.entity.User;
import com.eventtracker.exception.DuplicateEventException;
import com.eventtracker.repository.ApplicationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.eventtracker.util.UrlUtils;

import java.util.Optional;

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

    @Transactional(readOnly = true)
    public Page<ApplicationDTO> getUserApplications(Long userId, String status, String eventType, Pageable pageable) {
        // Guarantee a stable secondary sort by 'id' ASC
        Sort sort = pageable.getSort();
        if (sort.isSorted()) {
            if (sort.getOrderFor("id") == null) {
                sort = sort.and(Sort.by(Sort.Direction.ASC, "id"));
            }
        } else {
            sort = Sort.by(Sort.Direction.ASC, "deadline")
                    .and(Sort.by(Sort.Direction.ASC, "id"));
        }
        
        Pageable sortedPageable = PageRequest.of(
                pageable.getPageNumber(),
                pageable.getPageSize(),
                sort
        );

        Application.ApplicationStatus appStatus = null;
        if (status != null && !status.trim().isEmpty() && !status.equalsIgnoreCase("ALL")) {
            appStatus = parseStatus(status);
        }

        Application.EventType appEventType = null;
        if (eventType != null && !eventType.trim().isEmpty() && !eventType.equalsIgnoreCase("ALL")) {
            appEventType = parseEventType(eventType);
        }

        return applicationRepository.findFiltered(userId, appStatus, appEventType, sortedPageable)
                .map(this::convertToDTO);
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
            String normalizedUrl = UrlUtils.normalizeUrl(dto.getUrl());
            if (normalizedUrl != null && !normalizedUrl.equals(app.getUrl())) {
                applicationRepository.findByUserIdAndUrl(userId, normalizedUrl)
                    .ifPresent(existingApp -> {
                        if (!existingApp.getId().equals(app.getId())) {
                            throw new DuplicateEventException("Event already saved in your tracker with this URL");
                        }
                    });
            }
            app.setUrl(normalizedUrl);
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
}
