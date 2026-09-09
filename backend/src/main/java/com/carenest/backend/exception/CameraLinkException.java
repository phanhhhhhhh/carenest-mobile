package com.carenest.backend.exception;

import org.springframework.http.HttpStatus;
import java.util.Map;

public class CameraLinkException extends RuntimeException {

    private final String code;
    private final HttpStatus status;
    private final Map<String, Object> details;

    public CameraLinkException(String code, HttpStatus status, String message) {
        this(code, status, message, Map.of());
    }

    public CameraLinkException(String code, HttpStatus status, String message, Map<String, Object> details) {
        super(message);
        this.code = code;
        this.status = status;
        this.details = Map.copyOf(details);
    }

    public String getCode() {
        return code;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public Map<String, Object> getDetails() {
        return details;
    }
}
