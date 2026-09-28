package com.krishiconnect.controller;

import com.krishiconnect.dto.AuthDtos.*;
import com.krishiconnect.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService service;
    public AuthController(AuthService service) { this.service = service; }

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) { return service.register(request); }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) { return service.login(request); }

    @PostMapping("/refresh")
    public AuthResponse refresh(@Valid @RequestBody RefreshRequest request) { return service.refresh(request); }

    @PostMapping("/forgot-password")
    public Map<String,String> forgot(@Valid @RequestBody ForgotPasswordRequest request) {
        service.forgotPassword(request);
        return Map.of("message", "If an account exists for that email, a password reset link has been sent.");
    }

    @PostMapping("/reset-password")
    public Map<String,String> reset(@Valid @RequestBody ResetPasswordRequest request) {
        service.resetPassword(request);
        return Map.of("message", "Password updated successfully. You can now sign in.");
    }
}
