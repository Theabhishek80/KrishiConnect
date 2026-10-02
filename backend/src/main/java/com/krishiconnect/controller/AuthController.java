package com.krishiconnect.controller;

import com.krishiconnect.domain.Role;
import com.krishiconnect.dto.AuthDtos.*;
import com.krishiconnect.entity.User;
import com.krishiconnect.repository.UserRepository;
import com.krishiconnect.security.FirebaseIdentity;
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
    private final UserRepository users;

    public AuthController(
            AuthService service,
            FirebaseUserService firebaseUserService,
            UserRepository users
    ) {
        this.service = service;
        this.firebaseUserService = firebaseUserService;
        this.users = users;
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

        if (authentication == null) {
            throw new IllegalStateException(
                    "Firebase authentication required."
            );
        }

        Object details = authentication.getDetails();

        // Existing PostgreSQL user
        if (details instanceof Long userId) {

            User user = users.findById(userId)
                    .orElseThrow(() ->
                            new IllegalStateException(
                                    "Application profile not found."
                            )
                    );

            return sessionResponse(user);
        }

        throw new IllegalStateException(
                "Application profile not found."
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

        if (authentication == null) {
            throw new IllegalStateException(
                    "Firebase authentication required."
            );
        }

        Object details = authentication.getDetails();

        /*
         * EXISTING APPLICATION USER
         *
         * FirebaseAuthFilter already found the user's
         * PostgreSQL profile.
         */
        if (details instanceof Long userId) {

            User user = users.findById(userId)
                    .orElseThrow(() ->
                            new IllegalStateException(
                                    "Application profile not found."
                            )
                    );

            return sessionResponse(user);
        }

        /*
         * NEW FIREBASE USER
         */
        if (!(details instanceof FirebaseIdentity identity)) {

            throw new IllegalStateException(
                    "Firebase authentication required."
            );
        }

        String firebaseUid = identity.uid();
        String email = authentication.getName();

        String name = request.get("name");
        String roleValue = request.get("role");

        Role requestedRole = null;

        if (roleValue != null && !roleValue.isBlank()) {

            try {

                requestedRole = Role.valueOf(
                        roleValue.trim().toUpperCase()
                );

            } catch (IllegalArgumentException e) {

                throw new IllegalArgumentException(
                        "Invalid role. Use CONSUMER or FARMER."
                );
            }
        }

        User user = firebaseUserService.getOrCreateUser(
                firebaseUid,
                email,
                name,
                requestedRole,
                identity.emailVerified()
        );

        return sessionResponse(user);
    }
    private Map<String, Object> sessionResponse(User user) {
        AuthResponse session = service.issueSession(user);
        return Map.of(
                "id", user.getId(),
                "firebaseUid", user.getFirebaseUid() == null ? "" : user.getFirebaseUid(),
                "email", user.getEmail(),
                "name", user.getName(),
                "role", user.getRole().name(),
                "emailVerified", user.isEmailVerified(),
                "accessToken", session.accessToken(),
                "refreshToken", session.refreshToken(),
                "tokenType", session.tokenType()
        );
    }

}
