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

import java.util.LinkedHashMap;
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

    // ------------------------------------------------------------
    // BACKEND-JWT LOGIN
    //
    // Used for the admin account created from ADMIN_EMAIL/ADMIN_PASSWORD
    // (it has no Firebase account) and for older password accounts.
    // Public registration is intentionally NOT exposed here any more:
    // all new accounts are created through Firebase + /firebase/onboard,
    // which enforces e-mail verification.
    // ------------------------------------------------------------

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return service.login(request);
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(@Valid @RequestBody RefreshRequest request) {
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

    // ------------------------------------------------------------
    // PROFILE FOR THE SIGNED-IN USER
    // ------------------------------------------------------------

    @GetMapping("/firebase/me")
    public Map<String, Object> me(Authentication authentication) {

        if (authentication == null) {
            throw new IllegalStateException("Authentication required.");
        }

        if (authentication.getDetails() instanceof Long userId) {
            User user = users.findById(userId)
                    .orElseThrow(() ->
                            new IllegalStateException("Application profile not found."));
            return profile(user);
        }

        // Signed in with Firebase but no profile row yet -> 404 PROFILE_NOT_FOUND,
        // which makes the frontend run onboarding.
        throw new IllegalStateException("Application profile not found.");
    }

    // ------------------------------------------------------------
    // FIREBASE ONBOARDING  (create the PostgreSQL profile)
    // ------------------------------------------------------------

    @PostMapping("/firebase/onboard")
    public Map<String, Object> onboard(
            Authentication authentication,
            @RequestBody Map<String, String> request
    ) {

        if (authentication == null) {
            throw new IllegalStateException("Authentication required.");
        }

        Object details = authentication.getDetails();

        // Profile already exists.
        if (details instanceof Long userId) {
            User user = users.findById(userId)
                    .orElseThrow(() ->
                            new IllegalStateException("Application profile not found."));
            return profile(user);
        }

        if (!(details instanceof FirebaseIdentity identity)) {
            throw new IllegalStateException("Authentication required.");
        }

        String email = authentication.getName();
        String name = request.get("name");
        String roleValue = request.get("role");

        Role requestedRole = null;

        if (roleValue != null && !roleValue.isBlank()) {
            try {
                requestedRole = Role.valueOf(roleValue.trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid role. Use CONSUMER or FARMER.");
            }
        }

        // An older account already owns this e-mail and the visitor has not
        // proven they own it yet. Do not create a duplicate and do not link:
        // linking happens automatically on first sign-in AFTER verification.
        if (!identity.emailVerified()
                && users.findByEmailIgnoreCase(email).isPresent()) {

            Map<String, Object> pending = new LinkedHashMap<>();
            pending.put("pendingVerification", true);
            pending.put("message",
                    "Please verify your email, then sign in to finish linking your account.");
            return pending;
        }

        User user = firebaseUserService.getOrCreateUser(
                identity.uid(),
                email,
                name,
                requestedRole,
                identity.emailVerified()
        );

        return profile(user);
    }

    // ------------------------------------------------------------

    private Map<String, Object> profile(User user) {
        // LinkedHashMap, not Map.of: firebaseUid is null for the admin account.
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", user.getId());
        map.put("firebaseUid", user.getFirebaseUid());
        map.put("email", user.getEmail());
        map.put("name", user.getName());
        map.put("role", user.getRole().name());
        map.put("emailVerified", user.isEmailVerified());
        map.put("phone", user.getPhone());
        map.put("profileImageUrl", user.getProfileImageUrl());
        return map;
    }
}
