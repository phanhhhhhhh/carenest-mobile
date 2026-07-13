package com.carenest.backend.exception;

/**
 * Thrown when a feature requires a premium subscription
 * but the user is on the free tier.
 * Maps to HTTP 402 Payment Required.
 */
public class PaymentRequiredException extends RuntimeException {

    public PaymentRequiredException(String message) {
        super(message);
    }

    public PaymentRequiredException(String message, Throwable cause) {
        super(message, cause);
    }
}
