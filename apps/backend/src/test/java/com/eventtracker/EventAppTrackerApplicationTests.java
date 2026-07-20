package com.eventtracker;

import com.eventtracker.repository.ApplicationRepository;
import com.eventtracker.repository.PlacementRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
@ActiveProfiles("test")
class EventAppTrackerApplicationTests {

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private PlacementRepository placementRepository;

    @Test
    void contextLoads() {
        assertNotNull(applicationRepository);
        assertNotNull(placementRepository);
    }

    @Test
    void testFindFilteredQueries() {
        applicationRepository.findByUserId(1L, PageRequest.of(0, 10));
        applicationRepository.findFiltered(1L, null, null, PageRequest.of(0, 10));

        placementRepository.findFiltered(1L, null, PageRequest.of(0, 10));
    }
}
