package com.carenest.backend.repository;

import com.carenest.backend.entity.ElderlyProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ElderlyProfileRepository extends JpaRepository<ElderlyProfile, Long> {
    Optional<ElderlyProfile> findByIdAndDeletedAtIsNull(Long id);
    Optional<ElderlyProfile> findByUserIdAndDeletedAtIsNull(Long userId);
    boolean existsByUserIdAndDeletedAtIsNull(Long userId);
}
