package com.krishiconnect.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;

import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.builders.WebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;
import org.springframework.security.config.http.SessionCreationPolicy;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    /**
     * FirebaseAuthFilter should ONLY run inside Spring Security.
     */
    @Bean
    FilterRegistrationBean<FirebaseAuthFilter> firebaseAuthFilterRegistration(
            FirebaseAuthFilter filter
    ) {
        FilterRegistrationBean<FirebaseAuthFilter> registration =
                new FilterRegistrationBean<>(filter);

        registration.setEnabled(false);

        return registration;
    }

    /**
     * ============================================================
     * PUBLIC MANDI
     * ============================================================
     *
     * Completely bypass Spring Security for Mandi API.
     *
     * This means:
     *
     * /api/mandi
     * /api/mandi/**
     *
     * do NOT require Firebase/JWT authentication.
     */
    @Bean
    WebSecurityCustomizer webSecurityCustomizer() {
        return web -> web.ignoring().requestMatchers(
                "/api/mandi",
                "/api/mandi/**"
        );
    }

    @Bean
    SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            FirebaseAuthFilter authFilter
    ) throws Exception {

        return http

                .csrf(c -> c.disable())

                .cors(c -> c.configurationSource(cors()))

                .sessionManagement(s ->
                        s.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                .exceptionHandling(e ->
                        e.authenticationEntryPoint(
                                new HttpStatusEntryPoint(
                                        HttpStatus.UNAUTHORIZED
                                )
                        )
                )

                .authorizeHttpRequests(a -> a

                        // CORS
                        .requestMatchers(
                                HttpMethod.OPTIONS,
                                "/**"
                        ).permitAll()

                        // Health
                        .requestMatchers(
                                "/api/status"
                        ).permitAll()

                        // Authentication
                        .requestMatchers(
                                "/api/auth/login",
                                "/api/auth/refresh",
                                "/api/auth/forgot-password",
                                "/api/auth/reset-password"
                        ).permitAll()

                        // Public categories
                        .requestMatchers(
                                "/api/categories/**"
                        ).permitAll()

                        // Public advertisements
                        .requestMatchers(
                                "/api/advertisements"
                        ).permitAll()

                        // Public recipes
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/recipes",
                                "/api/recipes/**"
                        ).permitAll()

                        // Swagger
                        .requestMatchers(
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/v3/api-docs/**"
                        ).permitAll()

                        // Firebase onboarding
                        .requestMatchers(
                                "/api/auth/firebase/**"
                        ).authenticated()

                        // Farmer
                        .requestMatchers(
                                "/api/products/farmer",
                                "/api/products/farmer/**"
                        ).hasRole("FARMER")

                        // Public product catalogue
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/products",
                                "/api/products/**"
                        ).permitAll()

                        // Admin
                        .requestMatchers(
                                "/api/admin/**"
                        ).hasRole("ADMIN")

                        // Everything else
                        .anyRequest().authenticated()
                )

                .addFilterBefore(
                        authFilter,
                        UsernamePasswordAuthenticationFilter.class
                )

                .build();
    }

    @Bean
    CorsConfigurationSource cors() {

        CorsConfiguration c = new CorsConfiguration();

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
