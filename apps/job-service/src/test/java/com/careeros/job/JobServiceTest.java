package com.careeros.job;

import com.careeros.job.dto.JobDTO;
import com.careeros.job.dto.JobSearchRequest;
import com.careeros.job.dto.JobSearchResponse;
import com.careeros.job.exception.JobProviderException;
import com.careeros.job.provider.JobProvider;
import com.careeros.job.provider.JobvettaProvider;
import com.careeros.job.service.JobService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JobServiceTest {

    @Mock
    private JobProvider jobProvider;

    private JobService jobService;

    @BeforeEach
    void setUp() {
        jobService = new JobService(jobProvider);
    }

    @Test
    void testSearchJobs_Success() {
        JobDTO mockJob = JobDTO.builder()
                .externalJobId("job-101")
                .title("React Developer")
                .company("Concentrix")
                .location("Bangalore, Karnataka, India")
                .applyUrl("https://www.jobvetta.com/jobs/job-101")
                .source("Jobvetta")
                .build();

        JobSearchResponse mockResponse = JobSearchResponse.builder()
                .jobs(List.of(mockJob))
                .total(1)
                .page(0)
                .size(10)
                .source("Jobvetta")
                .build();

        when(jobProvider.getProviderName()).thenReturn("Jobvetta");
        when(jobProvider.searchJobs(any())).thenReturn(mockResponse);

        JobSearchRequest request = JobSearchRequest.builder()
                .keyword("react")
                .location("Bengaluru")
                .size(10)
                .build();

        JobSearchResponse response = jobService.searchJobs(request);

        assertNotNull(response);
        assertEquals(1, response.getJobs().size());
        assertEquals("React Developer", response.getJobs().get(0).getTitle());
        assertEquals("Concentrix", response.getJobs().get(0).getCompany());
        assertEquals("Jobvetta", response.getSource());
    }

    @Test
    void testGetJobById_Found() {
        JobDTO mockJob = JobDTO.builder()
                .externalJobId("job-101")
                .title("React Developer")
                .company("Concentrix")
                .description("Build scalable web apps")
                .skills(List.of("React", "TypeScript"))
                .applyUrl("https://www.jobvetta.com/jobs/job-101")
                .source("Jobvetta")
                .build();

        when(jobProvider.getProviderName()).thenReturn("Jobvetta");
        when(jobProvider.getJobById("job-101")).thenReturn(Optional.of(mockJob));

        Optional<JobDTO> result = jobService.getJobById("job-101");

        assertTrue(result.isPresent());
        assertEquals("React Developer", result.get().getTitle());
        assertEquals(2, result.get().getSkills().size());
    }

    @Test
    void testGetJobById_NotFound() {
        when(jobProvider.getProviderName()).thenReturn("Jobvetta");
        when(jobProvider.getJobById("non-existent")).thenReturn(Optional.empty());

        Optional<JobDTO> result = jobService.getJobById("non-existent");

        assertTrue(result.isEmpty());
    }

    @Test
    void testSearchJobs_ProviderUnconfigured() {
        JobvettaProvider unconfiguredProvider = new JobvettaProvider("", "https://api.jobvetta.com/v1", new ObjectMapper());
        assertFalse(unconfiguredProvider.isConfigured());

        JobSearchRequest request = JobSearchRequest.builder().keyword("react").build();

        JobProviderException exception = assertThrows(
                JobProviderException.class,
                () -> unconfiguredProvider.searchJobs(request)
        );

        assertEquals(503, exception.getStatusCode());
        assertEquals("PROVIDER_NOT_CONFIGURED", exception.getErrorCode());
    }

    @Test
    void testSearchJobs_RateLimitedException() {
        when(jobProvider.getProviderName()).thenReturn("Jobvetta");
        when(jobProvider.searchJobs(any())).thenThrow(new JobProviderException(
                "Jobvetta daily rate limit reached (50 requests/day).",
                429,
                "RATE_LIMITED"
        ));

        JobSearchRequest request = JobSearchRequest.builder().keyword("react").build();

        JobProviderException ex = assertThrows(
                JobProviderException.class,
                () -> jobService.searchJobs(request)
        );

        assertEquals(429, ex.getStatusCode());
        assertEquals("RATE_LIMITED", ex.getErrorCode());
    }
}
