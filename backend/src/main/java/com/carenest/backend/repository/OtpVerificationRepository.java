package com.carenest.backend.repository;

import com.carenest.backend.entity.OtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OtpVerificationRepository extends JpaRepository<OtpVerification, Long> {

    Optional<OtpVerification> findTopByPhoneAndVerifiedAtIsNullOrderByCreatedAtDesc(String phone);
}
