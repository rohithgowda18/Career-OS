package com.careeros.job.service;

import com.careeros.job.dto.JobDTO;
import com.careeros.job.dto.JobSearchRequest;
import com.careeros.job.dto.JobSearchResponse;
import com.careeros.job.provider.JobProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class JobService {

    private final JobProvider jobProvider;

    public JobSearchResponse searchJobs(JobSearchRequest request) {
        log.info("Executing job search via provider '{}': q='{}', location='{}', days={}",
                jobProvider.getProviderName(), request.getKeyword(), request.getLocation(), request.getDays());
        return jobProvider.searchJobs(request);
    }

    public Optional<JobDTO> getJobById(String jobId) {
        log.info("Fetching job detail via provider '{}' for jobId='{}'", jobProvider.getProviderName(), jobId);
        return jobProvider.getJobById(jobId);
    }
}
