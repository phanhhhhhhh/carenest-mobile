package com.carenest.backend.exception;

public class ImouApiException extends RuntimeException {

    public enum Kind {
        INVALID_CREDENTIALS,
        BOUND_TO_ANOTHER_ACCOUNT,
        ALREADY_OWNED,
        UNSUPPORTED_DEVICE,
        INVALID_DEVICE_CODE,
        PROVIDER_UNAVAILABLE,
        PROVIDER_REJECTED
    }

    private final Kind kind;
    private final String providerCode;

    public ImouApiException(Kind kind, String providerCode, String message) {
        super(message);
        this.kind = kind;
        this.providerCode = providerCode;
    }

    public ImouApiException(Kind kind, String providerCode, String message, Throwable cause) {
        super(message, cause);
        this.kind = kind;
        this.providerCode = providerCode;
    }

    public Kind getKind() {
        return kind;
    }

    public String getProviderCode() {
        return providerCode;
    }
}
