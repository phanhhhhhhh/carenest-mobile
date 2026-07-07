package com.carenest.backend.repository;

import com.carenest.backend.entity.GoogleFitToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GoogleFitTokenRepository extends JpaRepository<GoogleFitToken, Long> {

    /**
     * Find the Google Fit token for a user.
     */
    Optional<GoogleFitToken> findByUserId(Long userId);

    /**
     * Delete the Google Fit token for a user (disconnect).
     */
    void deleteByUserId(Long userId);
}
