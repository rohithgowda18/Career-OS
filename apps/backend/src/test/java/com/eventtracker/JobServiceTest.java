package com.eventtracker;

import com.eventtracker.dto.ApplicationDTO;
import com.eventtracker.dto.SaveJobRequest;
import com.eventtracker.dto.SavedJobResponse;
import com.eventtracker.dto.TrackJobApplicationRequest;
import com.eventtracker.entity.Application;
import com.eventtracker.entity.SavedJob;
import com.eventtracker.repository.SavedJobRepository;
import com.eventtracker.service.ApplicationService;
import com.eventtracker.service.JobService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JobServiceTest {

    @Mock
    private SavedJobRepository savedJobRepository;

    @Mock
    private ApplicationService applicationService;

    private JobService jobService;

    @BeforeEach
    void setUp() {
        jobService = new JobService(savedJobRepository, applicationService);
    }

    @Test
    void testGetSavedJobs() {
        SavedJob savedJob = SavedJob.builder()
                .id(1L)
                .userId(10L)
                .externalJobId("job-101")
                .source("Jobvetta")
                .createdAt(LocalDateTime.now())
                .build();

        when(savedJobRepository.findByUserIdOrderByCreatedAtDesc(eq(10L), any()))
                .thenReturn(new PageImpl<>(List.of(savedJob)));

        Page<SavedJobResponse> result = jobService.getSavedJobs(10L, PageRequest.of(0, 10));

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        assertEquals("job-101", result.getContent().get(0).getExternalJobId());
        assertEquals("Jobvetta", result.getContent().get(0).getSource());
    }

    @Test
    void testSaveJob_NewJob() {
        SaveJobRequest request = SaveJobRequest.builder()
                .externalJobId("job-456")
                .source("Jobvetta")
                .build();

        when(savedJobRepository.findByUserIdAndExternalJobIdAndSource(1L, "job-456", "Jobvetta"))
                .thenReturn(Optional.empty());
        when(savedJobRepository.save(any(SavedJob.class))).thenAnswer(i -> {
            SavedJob s = i.getArgument(0);
            s.setId(101L);
            s.setCreatedAt(LocalDateTime.now());
            return s;
        });

        SavedJobResponse saved = jobService.saveJob(1L, request);

        assertNotNull(saved);
        assertEquals(101L, saved.getId());
        assertEquals("job-456", saved.getExternalJobId());
        assertEquals("Jobvetta", saved.getSource());
    }

    @Test
    void testSaveJob_DuplicateIsIdempotent() {
        SaveJobRequest request = SaveJobRequest.builder()
                .externalJobId("job-456")
                .source("Jobvetta")
                .build();

        SavedJob existing = SavedJob.builder()
                .id(101L)
                .userId(1L)
                .externalJobId("job-456")
                .source("Jobvetta")
                .createdAt(LocalDateTime.now())
                .build();

        when(savedJobRepository.findByUserIdAndExternalJobIdAndSource(1L, "job-456", "Jobvetta"))
                .thenReturn(Optional.of(existing));

        SavedJobResponse result = jobService.saveJob(1L, request);

        assertNotNull(result);
        assertEquals(101L, result.getId());
        verify(savedJobRepository, never()).save(any());
    }

    @Test
    void testDeleteSavedJob_Success() {
        SavedJob existing = SavedJob.builder()
                .id(50L)
                .userId(1L)
                .build();

        when(savedJobRepository.findByIdAndUserId(50L, 1L)).thenReturn(Optional.of(existing));

        jobService.deleteSavedJob(1L, 50L);

        verify(savedJobRepository, times(1)).delete(existing);
    }

    @Test
    void testDeleteSavedJob_UnauthorizedOrNotFound() {
        when(savedJobRepository.findByIdAndUserId(50L, 2L)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> jobService.deleteSavedJob(2L, 50L));
        verify(savedJobRepository, never()).delete(any());
    }

    @Test
    void testTrackJobAsApplication_Success() {
        TrackJobApplicationRequest request = TrackJobApplicationRequest.builder()
                .title("Frontend Developer")
                .company("Amazon")
                .location("Hyderabad")
                .jobType("Internship")
                .applyUrl("https://www.jobvetta.com/jobs/789")
                .source("Jobvetta")
                .status("Applied")
                .build();

        Application mockApp = new Application();
        mockApp.setId(200L);
        mockApp.setUserId(1L);
        mockApp.setEventName("Amazon - Frontend Developer");

        when(applicationService.createApplication(eq(1L), any(ApplicationDTO.class))).thenReturn(mockApp);

        Application created = jobService.trackJobAsApplication(1L, request);

        assertNotNull(created);
        assertEquals(200L, created.getId());
        verify(applicationService).createApplication(eq(1L), argThat(appDTO ->
                appDTO.getEventName().equals("Amazon - Frontend Developer") &&
                appDTO.getEventType().equals("Internship") &&
                appDTO.getUrl().equals("https://www.jobvetta.com/jobs/789") &&
                appDTO.getNotes().contains("Jobvetta")
        ));
    }
}
