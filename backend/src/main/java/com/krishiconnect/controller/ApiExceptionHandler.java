package com.krishiconnect.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String,String> badRequest(IllegalArgumentException e) {
        return Map.of("error", e.getMessage() == null ? "Bad request" : e.getMessage());
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
}
