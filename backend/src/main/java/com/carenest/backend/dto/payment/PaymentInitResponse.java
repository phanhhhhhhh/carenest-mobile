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

    /** VietQR: bank account details + transfer memo for manual reconciliation (UC G3). */
    private String bankName;
    private String accountNumber;
    private String accountName;
    private String transferMemo;
    /** How the subscription is activated: "AUTO" for gateways, "MANUAL_REVIEW" for VietQR. */
    private String activation;
}
