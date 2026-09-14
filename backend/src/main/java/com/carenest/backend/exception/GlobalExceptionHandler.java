package com.carenest.backend.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<Map<String, Object>> handleUnauthorized(UnauthorizedException ex) {
        return error(HttpStatus.UNAUTHORIZED, ex.getMessage());
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(AccessDeniedException ex) {
        return error(HttpStatus.FORBIDDEN, "Access denied");
    }

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(NotFoundException ex) {
        return error(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<Map<String, Object>> handleConflict(ConflictException ex) {
        return error(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(PossibleDuplicateVisitException.class)
    public ResponseEntity<Map<String, Object>> handlePossibleDuplicateVisit(
        PossibleDuplicateVisitException ex
    ) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
            "status", HttpStatus.CONFLICT.value(),
            "code", PossibleDuplicateVisitException.CODE,
            "message", ex.getMessage(),
            "error", ex.getMessage(),
            "timestamp", OffsetDateTime.now().toString()
        ));
    }

    @ExceptionHandler(CameraLinkException.class)
    public ResponseEntity<Map<String, Object>> handleCameraLink(CameraLinkException ex) {
        Map<String, Object> body = new HashMap<>(ex.getDetails());
        body.put("status", ex.getStatus().value());
        body.put("code", ex.getCode());
        body.put("error", ex.getMessage());
        body.put("timestamp", OffsetDateTime.now().toString());
        return ResponseEntity.status(ex.getStatus()).body(body);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        log.warn("Data integrity violation: {}", ex.getMessage());
        return error(HttpStatus.CONFLICT, "Yêu cầu này xung đột với một bản ghi đã tồn tại. Vui lòng tải lại và thử lại.");
    }

    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<Map<String, Object>> handleOptimisticLock(ObjectOptimisticLockingFailureException ex) {
        log.warn("Optimistic lock conflict: {}", ex.getMessage());
        return error(HttpStatus.CONFLICT, "Bản ghi này vừa được người khác xử lý. Vui lòng tải lại danh sách và thử lại.");
    }

    @ExceptionHandler(PaymentRequiredException.class)
    public ResponseEntity<Map<String, Object>> handlePaymentRequired(PaymentRequiredException ex) {
        return error(HttpStatus.PAYMENT_REQUIRED, ex.getMessage());
    }

    @ExceptionHandler(RateLimitExceededException.class)
    public ResponseEntity<Map<String, Object>> handleRateLimit(RateLimitExceededException ex) {
        Map<String, Object> body = new HashMap<>(Map.of(
            "status", 429,
            "error", ex.getMessage(),
            "timestamp", OffsetDateTime.now().toString()
        ));
        body.put("retryAfter", ex.getRetryAfterSeconds());
        return ResponseEntity.status(429).body(body);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleBadRequest(IllegalArgumentException ex) {
        return error(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
            .map(e -> e.getField() + ": " + e.getDefaultMessage())
            .collect(Collectors.joining(", "));
        return error(HttpStatus.BAD_REQUEST, message);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneric(Exception ex) {
        log.error("Unhandled exception", ex);
        return error(HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
    }

    private ResponseEntity<Map<String, Object>> error(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(Map.of(
            "status", status.value(),
            "error", message,
            "timestamp", OffsetDateTime.now().toString()
        ));
    }
}
