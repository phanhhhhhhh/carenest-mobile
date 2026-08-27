package com.carenest.backend.repository;

import com.carenest.backend.entity.InviteToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.Optional;

@Repository
public interface InviteTokenRepository extends JpaRepository<InviteToken, Long> {

    Optional<InviteToken> findByToken(String token);

    @Modifying
    @Query("DELETE FROM InviteToken t WHERE t.expiresAt < :now")
    void deleteExpired(@Param("now") OffsetDateTime now);
}
