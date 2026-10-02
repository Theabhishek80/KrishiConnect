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
            FirebaseAuthFilter firebaseAuthFilter,
            JwtAuthFilter jwtAuthFilter
    ) throws Exception {

        return http
                .csrf(c -> c.disable())

                .cors(c ->
                        c.configurationSource(cors())
                )

                .sessionManagement(s ->
                        s.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                .authorizeHttpRequests(a -> a

                        // =================================================
                        // PUBLIC AUTH
                        // =================================================

                        .requestMatchers(
                                "/api/auth/login",
                                "/api/auth/register",
                                "/api/auth/refresh",
                                "/api/auth/forgot-password",
                                "/api/auth/reset-password"
                        ).permitAll()


                        // =================================================
                        // PUBLIC CATEGORIES
                        // =================================================

                        .requestMatchers(
                                "/api/categories/**"
                        ).permitAll()


                        // =================================================
                        // PUBLIC ADVERTISEMENTS
                        // =================================================

                        .requestMatchers(
                                "/api/advertisements"
                        ).permitAll()


                        // =================================================
                        // SWAGGER / OPENAPI
                        // =================================================

                        .requestMatchers(
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/v3/api-docs/**"
                        ).permitAll()


                        // =================================================
                        // FIREBASE AUTHENTICATION
                        // =================================================

                        .requestMatchers(
                                "/api/auth/firebase/**"
                        ).authenticated()


                        // =================================================
                        // FARMER PRODUCT APIs
                        // =================================================

                        .requestMatchers(
                                "/api/products/farmer",
                                "/api/products/farmer/**"
                        ).hasRole("FARMER")


                        // =================================================
                        // PUBLIC PRODUCT APIs
                        // =================================================

                        .requestMatchers(
                                "/api/products",
                                "/api/products/**"
                        ).permitAll()


                        // =================================================
                        // ADMIN APIs
                        // =================================================

                        .requestMatchers(
                                "/api/admin/**"
                        ).hasRole("ADMIN")


                        // =================================================
                        // CART / ORDERS / NOTIFICATIONS
                        // =================================================

                        .requestMatchers(
                                "/api/cart/**",
                                "/api/orders/**",
                                "/api/notifications/**"
                        ).authenticated()


                        // =================================================
                        // EVERYTHING ELSE
                        // =================================================

                        .anyRequest().authenticated()
                )

                // Accept both the application JWT and Firebase ID tokens.
                // JWT is evaluated first; Firebase is only used as the identity-provider fallback.
                .addFilterBefore(
                        jwtAuthFilter,
                        FirebaseAuthFilter.class
                )
                .addFilterBefore(
                        firebaseAuthFilter,
                        UsernamePasswordAuthenticationFilter.class
                )

                .build();
    }

    @Bean
    CorsConfigurationSource cors() {

        CorsConfiguration c =
                new CorsConfiguration();

        c.setAllowedOrigins(
                java.util.Arrays.stream(frontendUrl.split(","))
                        .map(String::trim)
                        .filter(origin -> !origin.isBlank())
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
