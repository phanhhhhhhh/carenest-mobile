package com.carenest.backend.repository;

import com.carenest.backend.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByTokenHashAndRevokedAtIsNull(String tokenHash);
    List<RefreshToken> findAllByUserIdAndRevokedAtIsNull(Long userId);
}