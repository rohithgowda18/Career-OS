package com.eventtracker.repository;

import com.eventtracker.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);
    Optional<User> findByOauthIdAndOauthProvider(String oauthId, String oauthProvider);
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
}
