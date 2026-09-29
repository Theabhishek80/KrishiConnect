package com.krishiconnect.controller;

import com.krishiconnect.domain.Role;
import com.krishiconnect.dto.AuthDtos.*;
import com.krishiconnect.entity.User;
import com.krishiconnect.service.AuthService;
import com.krishiconnect.service.FirebaseUserService;

import jakarta.validation.Valid;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService service;
    private final FirebaseUserService firebaseUserService;

    public AuthController(
            AuthService service,
            FirebaseUserService firebaseUserService
    ) {
        this.service = service;
        this.firebaseUserService = firebaseUserService;
    }

    // -------------------------
    // OLD AUTH - TEMPORARY
    // -------------------------

    @PostMapping("/register")
    public AuthResponse register(
            @Valid @RequestBody RegisterRequest request
    ) {
        return service.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(
            @Valid @RequestBody LoginRequest request
    ) {
        return service.login(request);
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(
            @Valid @RequestBody RefreshRequest request
    ) {
        return service.refresh(request);
    }

    @PostMapping("/forgot-password")
    public Map<String, String> forgot(
            @Valid @RequestBody ForgotPasswordRequest request
    ) {
        service.forgotPassword(request);

        return Map.of(
                "message",
                "If an account exists for that email, a password reset link has been sent."
        );
    }

    @PostMapping("/reset-password")
    public Map<String, String> reset(
            @Valid @RequestBody ResetPasswordRequest request
    ) {
        service.resetPassword(request);

        return Map.of(
                "message",
                "Password updated successfully. You can now sign in."
        );
    }

    // -------------------------
    // FIREBASE PROFILE
    // -------------------------

    @GetMapping("/firebase/me")
    public Map<String, Object> firebaseMe(
            Authentication authentication
    ) {

        if (authentication == null
                || authentication.getDetails() == null) {

            throw new IllegalStateException(
                    "Firebase authentication required."
            );
        }

        Long userId =
                (Long) authentication.getDetails();

        return Map.of(
                "id", userId,
                "email", authentication.getName()
        );
    }

    // -------------------------
    // FIREBASE ONBOARDING
    // -------------------------

    @PostMapping("/firebase/onboard")
    public Map<String, Object> firebaseOnboard(
            Authentication authentication,
            @RequestBody Map<String, String> request
    ) {

        if (authentication == null
                || authentication.getDetails() == null) {

            throw new IllegalStateException(
                    "Firebase authentication required."
            );
        }

        Long userId =
                (Long) authentication.getDetails();

        String name = request.get("name");
        String roleValue = request.get("role");

        Role role = null;

        if (roleValue != null && !roleValue.isBlank()) {
            role = Role.valueOf(
                    roleValue.trim().toUpperCase()
            );
        }

        /*
         * At this point the FirebaseAuthFilter has already
         * verified the Firebase token and linked/loaded
         * the PostgreSQL user.
         *
         * This endpoint is temporarily kept simple.
         */

        return Map.of(
                "id", userId,
                "name", name == null ? "" : name,
                "role", role == null ? "" : role.name()
        );
    }
}
