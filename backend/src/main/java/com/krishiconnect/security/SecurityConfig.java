package com.krishiconnect.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            FirebaseAuthFilter firebaseAuthFilter
    ) throws Exception {

        return http

                // -------------------------------------------------
                // CSRF
                // -------------------------------------------------
                .csrf(c -> c.disable())

                // -------------------------------------------------
                // CORS
                // -------------------------------------------------
                .cors(c -> c.configurationSource(cors()))

                // -------------------------------------------------
                // STATELESS API
                // -------------------------------------------------
                .sessionManagement(s ->
                        s.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                // -------------------------------------------------
                // AUTHORIZATION
                // -------------------------------------------------
                .authorizeHttpRequests(a -> a

                        // ===============================
                        // PUBLIC AUTH ENDPOINTS
                        // ===============================
                        .requestMatchers(
                                "/api/auth/login",
                                "/api/auth/register",
                                "/api/auth/refresh",
                                "/api/auth/forgot-password",
                                "/api/auth/reset-password"
                        ).permitAll()

                        // ===============================
                        // PUBLIC CATEGORIES
                        // ===============================
                        .requestMatchers(
                                "/api/categories/**"
                        ).permitAll()

                        // ===============================
                        // PUBLIC ADVERTISEMENT SLIDER
                        // ===============================
                        .requestMatchers(
                                "/api/advertisements"
                        ).permitAll()

                        // ===============================
                        // SWAGGER
                        // ===============================
                        .requestMatchers(
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/v3/api-docs/**"
                        ).permitAll()

                        // ===============================
                        // FIREBASE AUTH
                        // ===============================
                        .requestMatchers(
                                "/api/auth/firebase/**"
                        ).authenticated()

                        // ===============================
                        // FARMER PRODUCTS
                        // ===============================
                        .requestMatchers(
                                "/api/products/farmer",
                                "/api/products/farmer/**"
                        ).hasRole("FARMER")

                        // ===============================
                        // PUBLIC PRODUCT CATALOG
                        // ===============================
                        .requestMatchers(
                                "/api/products",
                                "/api/products/**"
                        ).permitAll()

                        // ===============================
                        // ADMIN
                        // ===============================
                        .requestMatchers(
                                "/api/admin/**"
                        ).hasRole("ADMIN")

                        // ===============================
                        // AUTHENTICATED USERS
                        // ===============================
                        .requestMatchers(
                                "/api/cart/**",
                                "/api/orders/**",
                                "/api/notifications/**"
                        ).authenticated()

                        // ===============================
                        // EVERYTHING ELSE
                        // ===============================
                        .anyRequest().authenticated()
                )

                // -------------------------------------------------
                // FIREBASE AUTHENTICATION
                //
                // Firebase is now the active authentication
                // mechanism for the application.
                // -------------------------------------------------
                .addFilterBefore(
                        firebaseAuthFilter,
                        UsernamePasswordAuthenticationFilter.class
                )

                .build();
    }

    // -------------------------------------------------------------
    // CORS CONFIGURATION
    // -------------------------------------------------------------
    @Bean
    CorsConfigurationSource cors() {

        CorsConfiguration c = new CorsConfiguration();

        // FRONTEND_URL may contain several comma-separated origins,
        // e.g. https://kisandirect.online,https://www.kisandirect.online
        c.setAllowedOrigins(
                java.util.Arrays.stream(frontendUrl.split(","))
                        .map(String::trim)
                        .filter(v -> !v.isEmpty())
                        .toList()
        );

        c.setAllowedMethods(
                List.of("*")
        );

        c.setAllowedHeaders(
                List.of("*")
        );

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
                "/**",
                c
        );

        return source;
    }
}
