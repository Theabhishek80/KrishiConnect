package com.krishiconnect.security;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import com.krishiconnect.entity.User;
import com.krishiconnect.repository.UserRepository;

import jakarta.servlet.*;
import jakarta.servlet.http.*;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class FirebaseAuthFilter extends OncePerRequestFilter {

    private final UserRepository users;

    public FirebaseAuthFilter(UserRepository users) {
        this.users = users;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest req,
            HttpServletResponse res,
            FilterChain chain
    ) throws IOException, ServletException {

        String header = req.getHeader("Authorization");

        if (header == null || !header.startsWith("Bearer ")) {
            chain.doFilter(req, res);
            return;
        }

        // If another authentication filter already authenticated
        // the request, don't overwrite it.
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            chain.doFilter(req, res);
            return;
        }

        String token = header.substring(7);

        try {
            FirebaseToken decodedToken =
                    FirebaseAuth.getInstance().verifyIdToken(token);

            String firebaseUid = decodedToken.getUid();
            String email = decodedToken.getEmail();

            if (email == null || email.isBlank()) {
                chain.doFilter(req, res);
                return;
            }

            User user = users.findByFirebaseUid(firebaseUid)
                    .orElseGet(() ->
                            users.findByEmailIgnoreCase(email)
                                    .map(existingUser -> {
                                        existingUser.setFirebaseUid(firebaseUid);
                                        existingUser.setEmailVerified(
                                                Boolean.TRUE.equals(
                                                        decodedToken.isEmailVerified()
                                                )
                                        );
                                        return users.save(existingUser);
                                    })
                                    .orElse(null)
                    );

            // Firebase account is valid, but application profile
            // does not exist yet.
            if (user == null) {
                chain.doFilter(req, res);
                return;
            }

            // Keep verification status synchronized with Firebase.
            if (user.isEmailVerified()
                    != decodedToken.isEmailVerified()) {

                user.setEmailVerified(
                        decodedToken.isEmailVerified()
                );

                user = users.save(user);
            }

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            decodedToken.getEmail(),
                            null,
                            List.of(
                                    new SimpleGrantedAuthority(
                                            "ROLE_" + user.getRole().name()
                                    )
                            )
                    );

            // AuthContext currently expects the database user ID
            // inside Authentication.details.
            authentication.setDetails(user.getId());

            SecurityContextHolder
                    .getContext()
                    .setAuthentication(authentication);

        } catch (Exception ignored) {
            // Invalid Firebase token.
            // Continue without authentication.
        }

        chain.doFilter(req, res);
    }
}
