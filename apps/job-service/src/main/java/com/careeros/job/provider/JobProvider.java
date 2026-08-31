package com.careeros.job.provider;

import com.careeros.job.dto.JobDTO;
import com.careeros.job.dto.JobSearchRequest;
import com.careeros.job.dto.JobSearchResponse;

import java.util.Optional;

public interface JobProvider {

    /**
     * Search live jobs matching the criteria from the external job provider.
     */
    JobSearchResponse searchJobs(JobSearchRequest request);

    /**
     * Fetch full structured details for a specific job from the provider.
     */
    Optional<JobDTO> getJobById(String jobId);

    /**
     * Provider name for source attribution.
     */
    String getProviderName();

    /**
     * True if required API keys / base URL are configured.
     */
    boolean isConfigured();
}
