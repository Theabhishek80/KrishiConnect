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

            /*
             * Firebase authentication is valid, but this is a
             * completely new application user.
             *
             * We still authenticate the Firebase identity so that
             * /api/auth/firebase/onboard can create the PostgreSQL
             * profile.
             */
            if (user == null) {

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                decodedToken.getEmail(),
                                null,
                                List.of(
                                        new SimpleGrantedAuthority(
                                                "ROLE_FIREBASE_USER"
                                        )
                                )
                        );

                /*
                 * For a new Firebase user there is no PostgreSQL ID yet.
                 *
                 * Store the Firebase UID here instead of the database ID.
                 * The onboarding endpoint can use the authenticated
                 * Firebase identity to create the database user.
                 */
               authentication.setDetails(
        new FirebaseIdentity(
                firebaseUid,
                Boolean.TRUE.equals(
                        decodedToken.isEmailVerified()
                )
        )
);

SecurityContextHolder
        .getContext()
        .setAuthentication(authentication);

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

            // Existing application user:
            // AuthContext expects the PostgreSQL user ID here.
            authentication.setDetails(user.getId());

            SecurityContextHolder
                    .getContext()
                    .setAuthentication(authentication);

      } catch (Exception ignored) {
            // The JWT filter may have already rejected/handled a non-Firebase token.
            // Continue so Spring Security can produce the correct 401/403 response.
        }

        chain.doFilter(req, res);
    }
}
