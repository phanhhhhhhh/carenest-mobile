package com.carenest.backend.repository;

import com.carenest.backend.entity.GoogleFitToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GoogleFitTokenRepository extends JpaRepository<GoogleFitToken, Long> {

    
    Optional<GoogleFitToken> findByUserId(Long userId);

    
    void deleteByUserId(Long userId);
}
