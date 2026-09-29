package com.krishiconnect.security;

import org.springframework.context.annotation.*;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.*;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;

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
            JwtAuthFilter filter
    ) throws Exception {

        return http
                .csrf(c -> c.disable())

                .cors(c -> c.configurationSource(cors()))

                .sessionManagement(s ->
                        s.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                .authorizeHttpRequests(a -> a

                        // PUBLIC
                        .requestMatchers(
                                "/api/auth/**",
                                "/api/categories/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/v3/api-docs/**"
                        ).permitAll()

                        // FARMER ONLY
                        .requestMatchers(
                                "/api/products/farmer",
                                "/api/products/farmer/**"
                        ).hasRole("FARMER")

                        // PUBLIC PRODUCT CATALOG
                        .requestMatchers(
                                "/api/products",
                                "/api/products/**"
                        ).permitAll()

                        // ADMIN ONLY
                        .requestMatchers(
                                "/api/admin/**"
                        ).hasRole("ADMIN")

                        // AUTHENTICATED USERS
                        .requestMatchers(
                                "/api/cart/**",
                                "/api/orders/**",
                                "/api/notifications/**"
                        ).authenticated()

                        .anyRequest().authenticated()
                )

                .addFilterBefore(
                        filter,
                        UsernamePasswordAuthenticationFilter.class
                )

                .build();
    }

    @Bean
    CorsConfigurationSource cors() {

        CorsConfiguration c = new CorsConfiguration();

        c.setAllowedOrigins(
                List.of(frontendUrl)
        );

        c.setAllowedMethods(
                List.of("*")
        );

        c.setAllowedHeaders(
                List.of("*")
        );

        UrlBasedCorsConfigurationSource s =
                new UrlBasedCorsConfigurationSource();

        s.registerCorsConfiguration(
                "/**",
                c
        );

        return s;
    }
}
