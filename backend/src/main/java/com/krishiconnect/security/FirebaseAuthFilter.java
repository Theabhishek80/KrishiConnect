package com.krishiconnect.security;

import com.google.firebase.FirebaseApp;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import com.krishiconnect.entity.User;
import com.krishiconnect.repository.UserRepository;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Single authentication filter for the whole API.
 *
 * Every request may carry "Authorization: Bearer <token>". The token is one of:
 *
 *  1. A backend-issued JWT (POST /api/auth/login). Used by the admin account
 *     created from ADMIN_EMAIL / ADMIN_PASSWORD and by any legacy
 *     password account.
 *  2. A Firebase ID token (email/password sign-up and "Sign in with Google").
 *
 * The backend JWT is tried first because it is a cheap local signature check;
 * anything else is verified with Firebase.
 *
 * NOTE: the old JwtAuthFilter was a separate servlet filter that ran AFTER
 * Spring Security had already rejected the request, so backend-JWT logins
 * never actually worked. Both token types are handled here, inside the
 * security chain, instead.
 */
@Component
public class FirebaseAuthFilter extends OncePerRequestFilter {

    private static final Logger log =
            LoggerFactory.getLogger(FirebaseAuthFilter.class);

    private final UserRepository users;
    private final JwtService jwt;

    public FirebaseAuthFilter(UserRepository users, JwtService jwt) {
        this.users = users;
        this.jwt = jwt;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest req,
            HttpServletResponse res,
            FilterChain chain
    ) throws IOException, ServletException {

        String header = req.getHeader("Authorization");

        if (header != null
                && header.startsWith("Bearer ")
                && SecurityContextHolder.getContext().getAuthentication() == null) {

            String token = header.substring(7).trim();

            try {
                if (!authenticateWithBackendJwt(token)) {
                    authenticateWithFirebase(token);
                }
            } catch (Exception e) {
                // Never let an auth problem become a 500 - the request simply
                // continues unauthenticated and Spring Security answers 401.
                log.warn("Authentication failed: {}", e.getMessage());
                SecurityContextHolder.clearContext();
            }
        }

        chain.doFilter(req, res);
    }

    // ------------------------------------------------------------------
    // 1. Backend JWT
    // ------------------------------------------------------------------

    /** @return true if the token was a valid backend JWT (even if the user is unusable). */
    private boolean authenticateWithBackendJwt(String token) {

        io.jsonwebtoken.Claims claims;

        try {
            claims = jwt.parse(token);
        } catch (Exception notOurs) {
            return false; // not a backend JWT (probably a Firebase token)
        }

        Object uid = claims.get("uid");

        if (uid == null) {
            return true;
        }

        Long userId = uid instanceof Number n
                ? n.longValue()
                : Long.valueOf(uid.toString());

        User user = users.findById(userId).orElse(null);

        if (user == null || !user.isEnabled()) {
            return true;
        }

        setAuthentication(user);
        return true;
    }

    // ------------------------------------------------------------------
    // 2. Firebase ID token
    // ------------------------------------------------------------------

    private void authenticateWithFirebase(String token) throws Exception {

        if (FirebaseApp.getApps().isEmpty()) {
            log.warn("Firebase is not configured (FIREBASE_SERVICE_ACCOUNT_JSON missing); "
                    + "cannot verify Firebase token.");
            return;
        }

        FirebaseToken decoded = FirebaseAuth.getInstance().verifyIdToken(token);

        String firebaseUid = decoded.getUid();
        String email = decoded.getEmail();
        boolean emailVerified = decoded.isEmailVerified();

        if (email == null || email.isBlank()) {
            return;
        }

        User user = users.findByFirebaseUid(firebaseUid).orElse(null);

        // First time this Firebase account is seen: attach it to an existing
        // application account with the same e-mail - but ONLY when Firebase
        // says the e-mail is verified. Otherwise anyone could sign up with
        // admin@... (unverified) and take over that account.
        if (user == null && emailVerified) {
            User byEmail = users.findByEmailIgnoreCase(email).orElse(null);

            if (byEmail != null
                    && (byEmail.getFirebaseUid() == null
                        || byEmail.getFirebaseUid().isBlank())) {
                byEmail.setFirebaseUid(firebaseUid);
                byEmail.setEmailVerified(true);
                user = users.save(byEmail);
            }
        }

        // Valid Firebase identity, but no application profile yet.
        // /api/auth/firebase/onboard will create it.
        if (user == null) {
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            email,
                            null,
                            List.of(new SimpleGrantedAuthority("ROLE_FIREBASE_USER"))
                    );

            authentication.setDetails(
                    new FirebaseIdentity(firebaseUid, emailVerified)
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);
            return;
        }

        if (!user.isEnabled()) {
            return;
        }

        if (user.isEmailVerified() != emailVerified) {
            user.setEmailVerified(emailVerified);
            user = users.save(user);
        }

        setAuthentication(user);
    }

    // ------------------------------------------------------------------

    private void setAuthentication(User user) {

        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(
                        user.getEmail(),
                        null,
                        List.of(new SimpleGrantedAuthority(
                                "ROLE_" + user.getRole().name()))
                );

        // AuthContext reads the PostgreSQL user id from here.
        authentication.setDetails(user.getId());

        SecurityContextHolder.getContext().setAuthentication(authentication);
    }
}
