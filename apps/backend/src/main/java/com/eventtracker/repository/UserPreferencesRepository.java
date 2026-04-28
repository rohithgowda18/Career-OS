package com.eventtracker.repository;

import com.eventtracker.entity.UserPreferences;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserPreferencesRepository extends JpaRepository<UserPreferences, Long> {
    Optional<UserPreferences> findByUserId(Long userId);

    // Single query replacing the old findAll()+per-user loop in DigestService.
    // JOIN FETCH loads the associated User in the same query, avoiding N+1.
    @Query("SELECT p FROM UserPreferences p JOIN FETCH p.user WHERE p.emailNotifications = true")
    List<UserPreferences> findAllByEmailNotificationsTrue();
}

