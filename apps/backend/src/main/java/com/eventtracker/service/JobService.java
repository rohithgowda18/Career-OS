package com.eventtracker.service;

import com.eventtracker.dto.ApplicationDTO;
import com.eventtracker.dto.JobDTO;
import com.eventtracker.dto.JobSearchCriteria;
import com.eventtracker.dto.JobSearchResult;
import com.eventtracker.entity.Application;
import com.eventtracker.entity.SavedJob;
import com.eventtracker.repository.SavedJobRepository;
import com.eventtracker.service.job.JobProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class JobService {

    private final JobProvider jobProvider;
    private final SavedJobRepository savedJobRepository;
    private final ApplicationService applicationService;

    @Transactional(readOnly = true)
    public JobSearchResult searchJobs(JobSearchCriteria criteria, Long currentUserId) {
        JobSearchResult result = jobProvider.searchJobs(criteria);

        // If user is authenticated, enrich jobs with their saved status
        if (currentUserId != null && result.getContent() != null && !result.getContent().isEmpty()) {
            List<SavedJob> userSaved = savedJobRepository.findByUserId(currentUserId);
            Map<String, SavedJob> savedMap = userSaved.stream()
                    .collect(Collectors.toMap(
                            SavedJob::getExternalJobId,
                            s -> s,
                            (existing, replacement) -> existing
                    ));

            for (JobDTO job : result.getContent()) {
                if (savedMap.containsKey(job.getExternalJobId())) {
                    SavedJob saved = savedMap.get(job.getExternalJobId());
                    job.setSaved(true);
                    job.setSavedJobId(saved.getId());
                }
            }
        }

        return result;
    }

    @Transactional(readOnly = true)
    public Optional<JobDTO> getJobById(String externalJobId, Long currentUserId) {
        Optional<JobDTO> jobOpt = jobProvider.getJobById(externalJobId);
        jobOpt.ifPresent(job -> {
            if (currentUserId != null) {
                savedJobRepository.findByUserIdAndExternalJobId(currentUserId, externalJobId)
                        .ifPresent(saved -> {
                            job.setSaved(true);
                            job.setSavedJobId(saved.getId());
                        });
            }
        });
        return jobOpt;
    }

    @Transactional(readOnly = true)
    public Page<JobDTO> getSavedJobs(Long userId, Pageable pageable) {
        Page<SavedJob> savedPage = savedJobRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        List<JobDTO> dtos = savedPage.getContent().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return new PageImpl<>(dtos, pageable, savedPage.getTotalElements());
    }

    public SavedJob saveJob(Long userId, JobDTO dto) {
        if (dto.getExternalJobId() == null || dto.getExternalJobId().isBlank()) {
            throw new IllegalArgumentException("externalJobId is required");
        }
        if (dto.getTitle() == null || dto.getTitle().isBlank()) {
            throw new IllegalArgumentException("title is required");
        }
        if (dto.getCompany() == null || dto.getCompany().isBlank()) {
            throw new IllegalArgumentException("company is required");
        }
        if (dto.getApplyUrl() == null || dto.getApplyUrl().isBlank()) {
            throw new IllegalArgumentException("applyUrl is required");
        }

        return savedJobRepository.findByUserIdAndExternalJobId(userId, dto.getExternalJobId())
                .orElseGet(() -> {
                    SavedJob savedJob = SavedJob.builder()
                            .userId(userId)
                            .externalJobId(dto.getExternalJobId())
                            .title(dto.getTitle())
                            .company(dto.getCompany())
                            .location(dto.getLocation())
                            .jobType(dto.getJobType())
                            .experience(dto.getExperienceLevel())
                            .workMode(dto.getWorkMode())
                            .source(dto.getSource() != null ? dto.getSource() : "Adzuna")
                            .applyUrl(dto.getApplyUrl())
                            .description(dto.getDescription())
                            .skills(dto.getSkills() != null ? String.join(", ", dto.getSkills()) : null)
                            .postedAt(dto.getPostedAt())
                            .build();
                    return savedJobRepository.save(savedJob);
                });
    }

    public void deleteSavedJob(Long userId, Long savedJobId) {
        SavedJob saved = savedJobRepository.findByIdAndUserId(savedJobId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Saved job not found or not owned by user"));
        savedJobRepository.delete(saved);
    }

    public Application trackJobAsApplication(Long userId, JobDTO jobDTO, String initialStatus) {
        if (jobDTO == null) {
            throw new IllegalArgumentException("Job data is required to track application");
        }

        // Map JobDTO to existing ApplicationDTO
        ApplicationDTO appDTO = new ApplicationDTO();
        appDTO.setEventName(jobDTO.getCompany() + " - " + jobDTO.getTitle());
        
        String eventType = "Other";
        if (jobDTO.getJobType() != null && jobDTO.getJobType().toLowerCase().contains("intern")) {
            eventType = "Internship";
        }
        appDTO.setEventType(eventType);

        String status = (initialStatus != null && !initialStatus.isBlank()) ? initialStatus : "Applied";
        appDTO.setStatus(status);

        appDTO.setUrl(jobDTO.getApplyUrl());
        appDTO.setLocation(jobDTO.getLocation());
        
        String sourceNote = "Discovered via Career OS Jobs (" + (jobDTO.getSource() != null ? jobDTO.getSource() : "Adzuna") + ")";
        appDTO.setNotes(sourceNote);

        // Delegate to existing ApplicationService (maintains full ownership and duplicate-URL checks)
        return applicationService.createApplication(userId, appDTO);
    }

    private JobDTO convertToDTO(SavedJob saved) {
        List<String> skillsList = Collections.emptyList();
        if (saved.getSkills() != null && !saved.getSkills().isBlank()) {
            skillsList = Arrays.stream(saved.getSkills().split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.toList());
        }

        return JobDTO.builder()
                .savedJobId(saved.getId())
                .saved(true)
                .externalJobId(saved.getExternalJobId())
                .title(saved.getTitle())
                .company(saved.getCompany())
                .location(saved.getLocation())
                .jobType(saved.getJobType())
                .experienceLevel(saved.getExperience())
                .workMode(saved.getWorkMode())
                .source(saved.getSource())
                .applyUrl(saved.getApplyUrl())
                .description(saved.getDescription())
                .postedAt(saved.getPostedAt())
                .skills(skillsList)
                .build();
    }
}
