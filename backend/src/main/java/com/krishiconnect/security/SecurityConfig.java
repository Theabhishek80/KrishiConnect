package com.krishiconnect.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;

import org.springframework.http.HttpMethod;

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


    // ============================================================
    // PASSWORD ENCODER
    // ============================================================

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }


    // ============================================================
    // FIREBASE FILTER
    // ============================================================

    @Bean
    FilterRegistrationBean<FirebaseAuthFilter> firebaseAuthFilterRegistration(
            FirebaseAuthFilter filter
    ) {

        FilterRegistrationBean<FirebaseAuthFilter> registration =
                new FilterRegistrationBean<>(filter);

        /*
         * FirebaseAuthFilter is used ONLY inside Spring Security.
         * Prevent Spring Boot from registering it separately.
         */
        registration.setEnabled(false);

        return registration;
    }


    // ============================================================
    // 1. PUBLIC MANDI SECURITY CHAIN
    // ============================================================
    //
    // This chain matches ONLY:
    //
    //     /api/mandi
    //     /api/mandi/**
    //
    // FirebaseAuthFilter is NOT added here.
    //
    // Therefore Mandi does not require:
    //
    //     Firebase token
    //     JWT
    //     Login
    //
    // ============================================================

    @Bean
    @Order(1)
    SecurityFilterChain mandiSecurityChain(
            HttpSecurity http
    ) throws Exception {

        http
                .securityMatcher(
                        "/api/mandi",
                        "/api/mandi/**"
                )

                .csrf(csrf -> csrf.disable())

                .cors(cors ->
                        cors.configurationSource(cors())
                )

                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                .authorizeHttpRequests(auth ->
                        auth.anyRequest().permitAll()
                );

        return http.build();
    }


    // ============================================================
    // 2. MAIN SECURITY CHAIN
    // ============================================================

    @Bean
    @Order(2)
    SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            FirebaseAuthFilter authFilter
    ) throws Exception {

        http

                .csrf(csrf ->
                        csrf.disable()
                )

                .cors(cors ->
                        cors.configurationSource(cors())
                )

                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                .authorizeHttpRequests(auth -> auth

                        // ------------------------------------------------
                        // CORS
                        // ------------------------------------------------

                        .requestMatchers(
                                HttpMethod.OPTIONS,
                                "/**"
                        ).permitAll()


                        // ------------------------------------------------
                        // SPRING BOOT ERROR PAGE
                        // ------------------------------------------------
                        //
                        // When a controller throws an exception that is
                        // not handled, Spring forwards the request to
                        // /error. If /error is not public, the REAL error
                        // (500) is replaced by an empty 403 Forbidden.
                        // That is exactly what was happening on /api/mandi.
                        //

                        .requestMatchers(
                                "/error"
                        ).permitAll()


                        // ------------------------------------------------
                        // HEALTH
                        // ------------------------------------------------

                        .requestMatchers(
                                "/api/status"
                        ).permitAll()


                        // ------------------------------------------------
                        // AUTH
                        // ------------------------------------------------

                        .requestMatchers(
                                "/api/auth/login",
                                "/api/auth/refresh",
                                "/api/auth/forgot-password",
                                "/api/auth/reset-password"
                        ).permitAll()


                        // ------------------------------------------------
                        // PUBLIC CATALOGUE
                        // ------------------------------------------------

                        .requestMatchers(
                                "/api/categories/**"
                        ).permitAll()

                        .requestMatchers(
                                "/api/advertisements"
                        ).permitAll()

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/recipes",
                                "/api/recipes/**"
                        ).permitAll()


                        // ------------------------------------------------
                        // SWAGGER
                        // ------------------------------------------------

                        .requestMatchers(
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/v3/api-docs/**"
                        ).permitAll()


                        // ------------------------------------------------
                        // FIREBASE ONBOARDING
                        // ------------------------------------------------

                        .requestMatchers(
                                "/api/auth/firebase/**"
                        ).authenticated()


                        // ------------------------------------------------
                        // FARMER
                        // ------------------------------------------------

                        .requestMatchers(
                                "/api/products/farmer",
                                "/api/products/farmer/**"
                        ).hasRole("FARMER")


                        // ------------------------------------------------
                        // PUBLIC PRODUCTS
                        // ------------------------------------------------

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/products",
                                "/api/products/**"
                        ).permitAll()


                        // ------------------------------------------------
                        // ADMIN
                        // ------------------------------------------------

                        .requestMatchers(
                                "/api/admin/**"
                        ).hasRole("ADMIN")


                        // ------------------------------------------------
                        // EVERYTHING ELSE
                        // ------------------------------------------------

                        .anyRequest().authenticated()
                )


                // Firebase/JWT authentication is ONLY in the
                // main authenticated chain.
                .addFilterBefore(
                        authFilter,
                        UsernamePasswordAuthenticationFilter.class
                );


        return http.build();
    }


    // ============================================================
    // CORS
    // ============================================================

    @Bean
    CorsConfigurationSource cors() {

        CorsConfiguration c =
                new CorsConfiguration();

        /*
         * FRONTEND_URL can contain:
         *
         * https://kisandirect.online,
         * https://www.kisandirect.online
         */

        c.setAllowedOrigins(
                java.util.Arrays.stream(
                                frontendUrl.split(",")
                        )
                        .map(String::trim)
                        .filter(v -> !v.isEmpty())
                        .toList()
        );

        c.setAllowedMethods(
                List.of(
                        "GET",
                        "POST",
                        "PUT",
                        "PATCH",
                        "DELETE",
                        "OPTIONS"
                )
        );

        c.setAllowedHeaders(
                List.of("*")
        );

        c.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
                "/**",
                c
        );

        return source;
    }
}

