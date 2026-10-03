package com.krishiconnect.service;

import com.krishiconnect.domain.Role;
import com.krishiconnect.dto.AuthDtos.*;
import com.krishiconnect.entity.*;
import com.krishiconnect.repository.*;
import com.krishiconnect.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.UUID;

@Service
public class AuthService {
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final RefreshTokenRepository refreshTokens;
    private final PasswordResetTokenRepository resetTokens;
    private final EmailService emailService;

    public AuthService(UserRepository users, PasswordEncoder encoder, JwtService jwt,
                       RefreshTokenRepository refreshTokens, PasswordResetTokenRepository resetTokens,
                       EmailService emailService) {
        this.users = users; this.encoder = encoder; this.jwt = jwt;
        this.refreshTokens = refreshTokens; this.resetTokens = resetTokens; this.emailService = emailService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest r) {
        if (users.findByEmailIgnoreCase(r.email()).isPresent())
            throw new IllegalArgumentException("Email is already registered.");

        Role role;
        try { role = Role.valueOf(r.role().toUpperCase()); }
        catch (Exception e) { role = Role.CONSUMER; }
        if (role == Role.ADMIN) throw new IllegalArgumentException("Admin registration is not public.");

        User u = new User();
        u.setName(r.name().trim());
        u.setEmail(r.email().trim().toLowerCase());
        u.setPasswordHash(encoder.encode(r.password()));
        u.setRole(role);
        u.setEnabled(true);
        users.save(u);
        return response(u);
    }

    public AuthResponse login(LoginRequest r) {
        User u = users.findByEmailIgnoreCase(r.email().trim()).orElseThrow(
            () -> new IllegalArgumentException("Invalid email or password."));
        if (!u.isEnabled()) throw new IllegalArgumentException("This account is disabled.");
        if (!encoder.matches(r.password(), u.getPasswordHash()))
            throw new IllegalArgumentException("Invalid email or password.");
        return response(u);
    }

    @Transactional
    public AuthResponse refresh(RefreshRequest r) {
        RefreshToken stored = refreshTokens.findByTokenHashAndRevokedFalse(hash(r.refreshToken()))
            .orElseThrow(() -> new IllegalArgumentException("Refresh token is invalid or expired."));
        if (stored.getExpiresAt().isBefore(Instant.now()))
            throw new IllegalArgumentException("Refresh token has expired.");
        stored.setRevoked(true);
        refreshTokens.save(stored);
        return response(stored.getUser());
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest r) {
        users.findByEmailIgnoreCase(r.email().trim()).ifPresent(user -> {
            resetTokens.deleteAll(resetTokens.findAll().stream()
                .filter(t -> t.getUser().getId().equals(user.getId()) && !t.isUsed()).toList());
            String raw = UUID.randomUUID().toString() + UUID.randomUUID();
            PasswordResetToken token = new PasswordResetToken();
            token.setUser(user);
            token.setTokenHash(hash(raw));
            token.setExpiresAt(Instant.now().plus(30, ChronoUnit.MINUTES));
            resetTokens.save(token);
            emailService.sendPasswordReset(user.getEmail(), raw);
        });
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest r) {
        PasswordResetToken token = resetTokens.findByTokenHashAndUsedFalse(hash(r.token()))
            .orElseThrow(() -> new IllegalArgumentException("Reset link is invalid or has expired."));
        if (token.getExpiresAt().isBefore(Instant.now()))
            throw new IllegalArgumentException("Reset link is invalid or has expired.");

        User user = token.getUser();
        user.setPasswordHash(encoder.encode(r.password()));
        users.save(user);
        token.setUsed(true);
        resetTokens.save(token);
        refreshTokens.deleteByUserId(user.getId());
    }

    private AuthResponse response(User u) {
        String rawRefresh = UUID.randomUUID().toString() + UUID.randomUUID();
        RefreshToken rt = new RefreshToken();
        rt.setUser(u);
        rt.setTokenHash(hash(rawRefresh));
        rt.setExpiresAt(Instant.now().plus(jwt.refreshDays(), ChronoUnit.DAYS));
        refreshTokens.save(rt);
        return new AuthResponse(jwt.create(u.getId(), u.getEmail(), u.getRole().name()),
            rawRefresh, "Bearer", u.getId(), u.getName(), u.getRole().name());
    }

    private String hash(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                .digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) { throw new IllegalStateException(e); }
    }
}
