package com.krishiconnect.dto;
import jakarta.validation.constraints.*;
public final class AuthDtos {
 public record RegisterRequest(@NotBlank String name,@Email @NotBlank String email,@Size(min=8) String password,@NotNull String role) {}
 public record LoginRequest(@Email @NotBlank String email,@NotBlank String password) {}
 public record AuthResponse(String accessToken,String refreshToken,String tokenType,Long userId,String name,String role) {}
 public record RefreshRequest(@NotBlank String refreshToken) {}
}
