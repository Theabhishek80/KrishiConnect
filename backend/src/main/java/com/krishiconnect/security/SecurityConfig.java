package com.krishiconnect.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;

import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
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
@EnableMethodSecurity
public class SecurityConfig {

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    /**
     * FirebaseAuthFilter is a @Component, so Spring Boot would also register
     * it as a plain servlet filter (outside the security chain). It belongs in
     * the security chain only.
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

    @Bean
    SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            FirebaseAuthFilter authFilter
    ) throws Exception {

        return http
                .csrf(c -> c.disable())
                .cors(c -> c.configurationSource(cors()))
                .sessionManagement(s ->
                        s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // Unauthenticated -> 401 (not the default 403) so the frontend
                // can tell "please sign in" from "you may not do this".
                .exceptionHandling(e -> e
                        .authenticationEntryPoint(
                                new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))

                .authorizeHttpRequests(a -> a

                        // CORS pre-flight
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // Health / diagnostics
                        .requestMatchers("/api/status").permitAll()

                        // Backend-JWT login (admin / legacy) and token refresh
                        .requestMatchers(
                                "/api/auth/login",
                                "/api/auth/refresh",
                                "/api/auth/forgot-password",
                                "/api/auth/reset-password"
                        ).permitAll()

                        // Public catalogue content
                        .requestMatchers("/api/categories/**").permitAll()
                        .requestMatchers("/api/advertisements").permitAll()
                        .requestMatchers("/api/mandi/**").permitAll()              
                        .requestMatchers(HttpMethod.GET,
                                "/api/recipes", "/api/recipes/**").permitAll()

                        // Swagger
                        .requestMatchers(
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/v3/api-docs/**"
                        ).permitAll()

                        // Firebase onboarding / profile
                        .requestMatchers("/api/auth/firebase/**").authenticated()

                        // Farmer product management
                        .requestMatchers(
                                "/api/products/farmer",
                                "/api/products/farmer/**"
                        ).hasRole("FARMER")

                        // Public product catalogue (GET only; writes need a login)
                        .requestMatchers(HttpMethod.GET,
                                "/api/products", "/api/products/**").permitAll()

                        // Admin
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")

                        // Everything else (cart, orders, profile, AI, ...)
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

        // FRONTEND_URL may hold several comma-separated origins, e.g.
        // https://kisandirect.online,https://www.kisandirect.online
        c.setAllowedOrigins(
                java.util.Arrays.stream(frontendUrl.split(","))
                        .map(String::trim)
                        .filter(v -> !v.isEmpty())
                        .toList()
        );

        c.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        c.setAllowedHeaders(List.of("*"));
        c.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", c);

        return source;
    }
}
