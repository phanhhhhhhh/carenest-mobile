package com.carenest.backend.dto.payment;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class PaymentInitResponse {
    private String paymentUrl;
    private String transactionId;
    private BigDecimal amount;
    private String planType;
    private String provider;
}
