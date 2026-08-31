package com.eventtracker.service.job;

import com.eventtracker.dto.JobDTO;
import com.eventtracker.dto.JobSearchCriteria;
import com.eventtracker.dto.JobSearchResult;

import java.util.Optional;

public interface JobProvider {

    /**
     * Search for live jobs using normalized criteria.
     * Must return real jobs from an external provider or throw an appropriate exception.
     */
    JobSearchResult searchJobs(JobSearchCriteria criteria);

    /**
     * Get details for a specific external job by its ID if supported by the provider.
     */
    Optional<JobDTO> getJobById(String externalJobId);

    /**
     * Return provider name for attribution (e.g. "Adzuna").
     */
    String getProviderName();

    /**
     * Returns true if provider credentials and configuration are properly set.
     */
    boolean isConfigured();
}
