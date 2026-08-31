package com.eventtracker;

import com.eventtracker.dto.ApplicationDTO;
import com.eventtracker.dto.JobDTO;
import com.eventtracker.dto.JobSearchCriteria;
import com.eventtracker.dto.JobSearchResult;
import com.eventtracker.entity.Application;
import com.eventtracker.entity.SavedJob;
import com.eventtracker.repository.SavedJobRepository;
import com.eventtracker.service.ApplicationService;
import com.eventtracker.service.JobService;
import com.eventtracker.service.job.JobProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JobServiceTest {

    @Mock
    private JobProvider jobProvider;

    @Mock
    private SavedJobRepository savedJobRepository;

    @Mock
    private ApplicationService applicationService;

    private JobService jobService;

    @BeforeEach
    void setUp() {
        jobService = new JobService(jobProvider, savedJobRepository, applicationService);
    }

    @Test
    void testSearchJobs_SuccessAndEnrichSaved() {
        JobDTO job = JobDTO.builder()
                .externalJobId("job-123")
                .title("Software Engineer Intern")
                .company("Google")
                .location("Bangalore")
                .applyUrl("https://careers.google.com/jobs/123")
                .build();

        JobSearchResult mockResult = JobSearchResult.builder()
                .content(List.of(job))
                .totalElements(1)
                .totalPages(1)
                .currentPage(0)
                .size(10)
                .source("Adzuna")
                .build();

        when(jobProvider.searchJobs(any())).thenReturn(mockResult);

        SavedJob savedJob = SavedJob.builder()
                .id(99L)
                .userId(1L)
                .externalJobId("job-123")
                .build();
        when(savedJobRepository.findByUserId(1L)).thenReturn(List.of(savedJob));

        JobSearchCriteria criteria = JobSearchCriteria.builder()
                .keyword("java")
                .location("Bangalore")
                .build();

        JobSearchResult result = jobService.searchJobs(criteria, 1L);

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        assertTrue(result.getContent().get(0).isSaved());
        assertEquals(99L, result.getContent().get(0).getSavedJobId());
    }

    @Test
    void testSaveJob_NewJob() {
        JobDTO dto = JobDTO.builder()
                .externalJobId("job-456")
                .title("Backend Engineer")
                .company("Microsoft")
                .applyUrl("https://careers.microsoft.com/456")
                .source("Adzuna")
                .build();

        when(savedJobRepository.findByUserIdAndExternalJobId(1L, "job-456")).thenReturn(Optional.empty());
        when(savedJobRepository.save(any(SavedJob.class))).thenAnswer(i -> {
            SavedJob s = i.getArgument(0);
            s.setId(101L);
            return s;
        });

        SavedJob saved = jobService.saveJob(1L, dto);

        assertNotNull(saved);
        assertEquals(101L, saved.getId());
        assertEquals("job-456", saved.getExternalJobId());
        assertEquals(1L, saved.getUserId());
    }

    @Test
    void testSaveJob_DuplicateIsIdempotent() {
        JobDTO dto = JobDTO.builder()
                .externalJobId("job-456")
                .title("Backend Engineer")
                .company("Microsoft")
                .applyUrl("https://careers.microsoft.com/456")
                .build();

        SavedJob existing = SavedJob.builder()
                .id(101L)
                .userId(1L)
                .externalJobId("job-456")
                .build();

        when(savedJobRepository.findByUserIdAndExternalJobId(1L, "job-456")).thenReturn(Optional.of(existing));

        SavedJob result = jobService.saveJob(1L, dto);

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
        JobDTO dto = JobDTO.builder()
                .externalJobId("job-789")
                .title("Frontend Developer")
                .company("Amazon")
                .location("Hyderabad")
                .jobType("Internship")
                .applyUrl("https://amazon.jobs/789")
                .source("Adzuna")
                .build();

        Application mockApp = new Application();
        mockApp.setId(200L);
        mockApp.setUserId(1L);
        mockApp.setEventName("Amazon - Frontend Developer");

        when(applicationService.createApplication(eq(1L), any(ApplicationDTO.class))).thenReturn(mockApp);

        Application created = jobService.trackJobAsApplication(1L, dto, "Applied");

        assertNotNull(created);
        assertEquals(200L, created.getId());
        verify(applicationService).createApplication(eq(1L), argThat(appDTO ->
                appDTO.getEventName().equals("Amazon - Frontend Developer") &&
                appDTO.getEventType().equals("Internship") &&
                appDTO.getUrl().equals("https://amazon.jobs/789")
        ));
    }
}
