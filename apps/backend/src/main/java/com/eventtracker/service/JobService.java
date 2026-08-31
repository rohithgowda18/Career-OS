package com.eventtracker.service;

import com.eventtracker.dto.ApplicationDTO;
import com.eventtracker.dto.SaveJobRequest;
import com.eventtracker.dto.SavedJobResponse;
import com.eventtracker.dto.TrackJobApplicationRequest;
import com.eventtracker.entity.Application;
import com.eventtracker.entity.SavedJob;
import com.eventtracker.repository.SavedJobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class JobService {

    private final SavedJobRepository savedJobRepository;
    private final ApplicationService applicationService;

    @Transactional(readOnly = true)
    public Page<SavedJobResponse> getSavedJobs(Long userId, Pageable pageable) {
        return savedJobRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::convertToResponse);
    }

    @Transactional(readOnly = true)
    public List<SavedJobResponse> getAllSavedJobsForUser(Long userId) {
        return savedJobRepository.findByUserId(userId).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    public SavedJobResponse saveJob(Long userId, SaveJobRequest request) {
        if (request.getExternalJobId() == null || request.getExternalJobId().isBlank()) {
            throw new IllegalArgumentException("externalJobId is required");
        }
        String source = (request.getSource() != null && !request.getSource().isBlank())
                ? request.getSource().trim()
                : "Jobvetta";

        SavedJob savedJob = savedJobRepository.findByUserIdAndExternalJobIdAndSource(userId, request.getExternalJobId().trim(), source)
                .orElseGet(() -> {
                    SavedJob newSaved = SavedJob.builder()
                            .userId(userId)
                            .externalJobId(request.getExternalJobId().trim())
                            .source(source)
                            .build();
                    return savedJobRepository.save(newSaved);
                });

        return convertToResponse(savedJob);
    }

    public void deleteSavedJob(Long userId, Long savedJobId) {
        SavedJob saved = savedJobRepository.findByIdAndUserId(savedJobId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Saved job not found or not owned by user"));
        savedJobRepository.delete(saved);
    }

    public Application trackJobAsApplication(Long userId, TrackJobApplicationRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Tracking request is required");
        }

        ApplicationDTO appDTO = new ApplicationDTO();
        appDTO.setEventName(request.getCompany() + " - " + request.getTitle());

        String eventType = "Other";
        if (request.getJobType() != null && request.getJobType().toLowerCase().contains("intern")) {
            eventType = "Internship";
        }
        appDTO.setEventType(eventType);

        String status = (request.getStatus() != null && !request.getStatus().isBlank())
                ? request.getStatus()
                : "Applied";
        appDTO.setStatus(status);

        appDTO.setUrl(request.getApplyUrl());
        appDTO.setLocation(request.getLocation());

        String sourceName = (request.getSource() != null && !request.getSource().isBlank())
                ? request.getSource()
                : "Jobvetta";
        appDTO.setNotes("Discovered via Career OS Jobs (Source: " + sourceName + ")");

        return applicationService.createApplication(userId, appDTO);
    }

    private SavedJobResponse convertToResponse(SavedJob saved) {
        return SavedJobResponse.builder()
                .id(saved.getId())
                .externalJobId(saved.getExternalJobId())
                .source(saved.getSource())
                .createdAt(saved.getCreatedAt())
                .build();
    }
}
