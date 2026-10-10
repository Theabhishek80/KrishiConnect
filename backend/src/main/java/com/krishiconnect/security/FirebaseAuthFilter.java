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
 * Supports:
 *
 *  1. Backend-issued JWT
 *  2. Firebase ID token
 *
 * Public endpoints are allowed to pass through without authentication.
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

        /*
         * ============================================================
         * PUBLIC ENDPOINTS
         * ============================================================
         *
         * These endpoints do NOT require login.
         *
         * Mandi is intentionally public so visitors can see mandi
         * prices without signing in.
         */
        if (isPublicEndpoint(req)) {
            chain.doFilter(req, res);
            return;
        }

        String header = req.getHeader("Authorization");

        /*
         * ============================================================
         * AUTHENTICATION
         * ============================================================
         */
        if (header != null
                && header.startsWith("Bearer ")
                && SecurityContextHolder.getContext().getAuthentication() == null) {

            String token = header.substring(7).trim();

            try {

                /*
                 * First try our own backend JWT.
                 */
                if (!authenticateWithBackendJwt(token)) {

                    /*
                     * If it isn't our JWT, try Firebase.
                     */
                    authenticateWithFirebase(token);
                }

            } catch (Exception e) {

                /*
                 * Authentication failure should not become a 500.
                 * Spring Security will decide whether the endpoint
                 * requires authentication.
                 */
                log.warn("Authentication failed: {}", e.getMessage());

                SecurityContextHolder.clearContext();
            }
        }

        chain.doFilter(req, res);
    }

    /**
     * Determines whether a request is publicly accessible.
     *
     * IMPORTANT:
     * Mandi is public.
     */
    private boolean isPublicEndpoint(HttpServletRequest req) {

        String path = req.getServletPath();
        String method = req.getMethod();

        /*
         * CORS preflight
         */
        if ("OPTIONS".equalsIgnoreCase(method)) {
            return true;
        }

        /*
         * Health / system status
         */
        if (path.equals("/api/status")) {
            return true;
        }

        /*
         * Authentication endpoints
         */
        if (path.equals("/api/auth/login")
                || path.equals("/api/auth/refresh")
                || path.equals("/api/auth/forgot-password")
                || path.equals("/api/auth/reset-password")) {
            return true;
        }

        /*
         * Public categories
         */
        if (path.startsWith("/api/categories/")) {
            return true;
        }

        /*
         * Public advertisements
         */
        if (path.equals("/api/advertisements")) {
            return true;
        }

        /*
         * Public recipes
         */
        if (path.equals("/api/recipes")
                || path.startsWith("/api/recipes/")) {
            return true;
        }

        /*
         * Public blogs
         */
        if (path.equals("/api/blogs")
                || path.startsWith("/api/blogs/")) {
            return true;
        }

        /*
         * ============================================================
         * MANDI RATES
         * ============================================================
         *
         * PUBLIC
         *
         * Visitors do NOT need to log in to view mandi prices.
         */
        if (path.equals("/api/mandi")
                || path.startsWith("/api/mandi/")) {
            return true;
        }

        /*
         * Everything else can go through authentication.
         */
        return false;
    }

    // ------------------------------------------------------------------
    // 1. Backend JWT
    // ------------------------------------------------------------------

    /**
     * @return true if the token was a valid backend JWT
     */
    private boolean authenticateWithBackendJwt(String token) {

        io.jsonwebtoken.Claims claims;

        try {

            claims = jwt.parse(token);

        } catch (Exception notOurs) {

            /*
             * Not our JWT.
             * It may be a Firebase token.
             */
            return false;
        }

        Object uid = claims.get("uid");

        if (uid == null) {
            return true;
        }

        Long userId =
                uid instanceof Number n
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

            log.warn(
                    "Firebase is not configured (FIREBASE_SERVICE_ACCOUNT_JSON missing); "
                            + "cannot verify Firebase token."
            );

            return;
        }

        FirebaseToken decoded =
                FirebaseAuth.getInstance().verifyIdToken(token);

        String firebaseUid = decoded.getUid();

        String email = decoded.getEmail();

        boolean emailVerified = decoded.isEmailVerified();

        if (email == null || email.isBlank()) {
            return;
        }

        User user =
                users.findByFirebaseUid(firebaseUid).orElse(null);

        /*
         * First time this Firebase account is seen:
         *
         * Attach it to an existing application account with
         * the same email only when Firebase says the email
         * is verified.
         */
        if (user == null && emailVerified) {

            User byEmail =
                    users.findByEmailIgnoreCase(email).orElse(null);

            if (byEmail != null
                    && (byEmail.getFirebaseUid() == null
                    || byEmail.getFirebaseUid().isBlank())) {

                byEmail.setFirebaseUid(firebaseUid);

                byEmail.setEmailVerified(true);

                user = users.save(byEmail);
            }
        }

        /*
         * Valid Firebase identity but no application profile yet.
         *
         * /api/auth/firebase/onboard can create the profile.
         */
        if (user == null) {

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            email,
                            null,
                            List.of(
                                    new SimpleGrantedAuthority(
                                            "ROLE_FIREBASE_USER"
                                    )
                            )
                    );

            authentication.setDetails(
                    new FirebaseIdentity(
                            firebaseUid,
                            emailVerified
                    )
            );

            SecurityContextHolder
                    .getContext()
                    .setAuthentication(authentication);

            return;
        }

        /*
         * Account disabled.
         */
        if (!user.isEnabled()) {
            return;
        }

        /*
         * Keep application email verification status synchronized.
         */
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
                        List.of(
                                new SimpleGrantedAuthority(
                                        "ROLE_" + user.getRole().name()
                                )
                        )
                );

        /*
         * AuthContext reads the PostgreSQL user ID from here.
         */
        authentication.setDetails(user.getId());

        SecurityContextHolder
                .getContext()
                .setAuthentication(authentication);
    }
}

