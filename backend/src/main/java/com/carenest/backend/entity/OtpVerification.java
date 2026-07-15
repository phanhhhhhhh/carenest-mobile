package com.carenest.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "otp_verifications")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OtpVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String phone;

    private String otpCode;

    private OffsetDateTime expiresAt;

    private OffsetDateTime verifiedAt;

    private short attempts;

    private OffsetDateTime createdAt;
}
