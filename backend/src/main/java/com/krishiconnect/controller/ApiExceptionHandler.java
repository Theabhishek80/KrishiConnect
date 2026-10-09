package com.krishiconnect.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {

    private static final Logger log =
            LoggerFactory.getLogger(ApiExceptionHandler.class);

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String,String> badRequest(IllegalArgumentException e) {
        return Map.of("error", e.getMessage() == null ? "Bad request" : e.getMessage());
    }

    // 404 for "not found" thrown by the dairy services.
    @ExceptionHandler(java.util.NoSuchElementException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public Map<String,String> notFound(java.util.NoSuchElementException e) {
        return Map.of("error", e.getMessage() == null ? "Not found" : e.getMessage());
    }

    // Keeps the HTTP status chosen by the code and exposes the reason as "error".
    @ExceptionHandler(org.springframework.web.server.ResponseStatusException.class)
    public org.springframework.http.ResponseEntity<Map<String,String>> statusException(
            org.springframework.web.server.ResponseStatusException e) {
        String reason = e.getReason() == null ? "Request failed" : e.getReason();
        return org.springframework.http.ResponseEntity
            .status(e.getStatusCode())
            .body(Map.of("error", reason, "message", reason));
    }

    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public Map<String,String> forbidden(Exception e) { return Map.of("error", "Forbidden"); }

    // Firebase user exists but has no application profile yet. The frontend
    // reacts to 404 + code PROFILE_NOT_FOUND by running onboarding.
    // Any other IllegalStateException is a genuine server-side failure.
    @ExceptionHandler(IllegalStateException.class)
    public org.springframework.http.ResponseEntity<Map<String,String>> illegalState(IllegalStateException e) {
        String message = e.getMessage() == null ? "Something went wrong." : e.getMessage();
        String lower = message.toLowerCase();

        if (lower.contains("profile not found")) {
            return org.springframework.http.ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", message, "code", "PROFILE_NOT_FOUND"));
        }

        if (lower.contains("authentication required")) {
            return org.springframework.http.ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", message, "code", "AUTH_REQUIRED"));
        }

        log.error("Server error: {}", message, e);

        return org.springframework.http.ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(Map.of("error", message));
    }

    @ExceptionHandler(org.springframework.web.multipart.MaxUploadSizeExceededException.class)
    @ResponseStatus(HttpStatus.PAYLOAD_TOO_LARGE)
    public Map<String,String> tooLarge(Exception e) {
        return Map.of("error", "File is too large. Maximum size is 10 MB.");
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String,String> validation(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
            .findFirst().map(x -> x.getField() + ": " + x.getDefaultMessage()).orElse("Invalid request");
        return Map.of("error", message);
    }

    // Malformed / wrongly-typed JSON (e.g. a text value where a number is expected).
    @ExceptionHandler(HttpMessageNotReadableException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String,String> unreadable(HttpMessageNotReadableException e) {
        return Map.of("error", "Invalid request data. Please check the values you entered.");
    }

    // Database constraint failures (bad category id, value too long, ...).
    @ExceptionHandler(DataIntegrityViolationException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public Map<String,String> dataIntegrity(DataIntegrityViolationException e) {
        log.error("Data integrity violation", e);
        return Map.of("error", "Could not save this data. Please check the values and try again.");
    }
}
