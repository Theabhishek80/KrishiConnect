package com.krishiconnect.dto;

import jakarta.validation.constraints.*;

public final class AuthDtos {
    public record RegisterRequest(
        @NotBlank @Size(max=120) String name,
        @Email @NotBlank @Size(max=255) String email,
        @NotBlank @Size(min=8, max=100) String password,
        @NotNull String role
    ) {}
    public record LoginRequest(@Email @NotBlank String email, @NotBlank String password) {}
    public record AuthResponse(String accessToken, String refreshToken, String tokenType, Long userId, String name, String role) {}
    public record RefreshRequest(@NotBlank String refreshToken) {}
    public record ForgotPasswordRequest(@Email @NotBlank String email) {}
    public record ResetPasswordRequest(@NotBlank String token, @NotBlank @Size(min=8, max=100) String password) {}
}
