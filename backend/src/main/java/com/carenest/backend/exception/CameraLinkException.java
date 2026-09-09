package com.carenest.backend.exception;

import org.springframework.http.HttpStatus;

public class CameraLinkException extends RuntimeException {

    private final String code;
    private final HttpStatus status;

    public CameraLinkException(String code, HttpStatus status, String message) {
        super(message);
        this.code = code;
        this.status = status;
    }

    public String getCode() {
        return code;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
