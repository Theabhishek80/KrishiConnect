package com.krishiconnect.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
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

import java.util.Arrays;
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
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }


    // ============================================================
    // FIREBASE AUTH FILTER
    // ============================================================

    @Bean
    public FilterRegistrationBean<FirebaseAuthFilter>
    firebaseAuthFilterRegistration(FirebaseAuthFilter filter) {

        FilterRegistrationBean<FirebaseAuthFilter> registration =
                new FilterRegistrationBean<>(filter);

        // FirebaseAuthFilter must run only inside Spring Security.
        registration.setEnabled(false);

        return registration;
    }


    // ============================================================
    // PUBLIC MANDI SECURITY
    // ============================================================

    @Bean
    @org.springframework.core.annotation.Order(1)
    public SecurityFilterChain mandiSecurityChain(
            HttpSecurity http
    ) throws Exception {

        http
                .securityMatcher(
                        "/api/mandi",
                        "/api/mandi/**"
                )

                .csrf(csrf -> csrf.disable())

                .cors(cors ->
                        cors.configurationSource(corsConfigurationSource())
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
    // MAIN SECURITY CHAIN
    // ============================================================

    @Bean
    @org.springframework.core.annotation.Order(2)
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            FirebaseAuthFilter firebaseAuthFilter
    ) throws Exception {

        http

                // ------------------------------------------------
                // CSRF
                // ------------------------------------------------

                .csrf(csrf -> csrf.disable())


                // ------------------------------------------------
                // CORS
                // ------------------------------------------------

                .cors(cors ->
                        cors.configurationSource(corsConfigurationSource())
                )


                // ------------------------------------------------
                // STATELESS API
                // ------------------------------------------------

                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )


                // ------------------------------------------------
                // AUTHORIZATION
                // ------------------------------------------------

                .authorizeHttpRequests(auth -> auth

                        // CORS preflight
                        .requestMatchers(
                                HttpMethod.OPTIONS,
                                "/**"
                        ).permitAll()


                        // Spring error endpoint
                        .requestMatchers(
                                "/error"
                        ).permitAll()


                        // Health check
                        .requestMatchers(
                                "/api/status"
                        ).permitAll()


                        // ------------------------------------------------
                        // PUBLIC AUTH ENDPOINTS
                        // ------------------------------------------------

                        .requestMatchers(
                                "/api/auth/login",
                                "/api/auth/refresh",
                                "/api/auth/forgot-password",
                                "/api/auth/reset-password"
                        ).permitAll()


                        // ------------------------------------------------
                        // FIREBASE AUTHENTICATION
                        // ------------------------------------------------

                        .requestMatchers(
                                "/api/auth/firebase/**"
                        ).authenticated()


                                       
// ------------------------------------------------
// PUBLIC DAIRY STORE DISCOVERY
// ------------------------------------------------


                        // ------------------------------------------------
                        // DAIRY MARKETPLACE
                        // ------------------------------------------------

                        // Anyone can browse active dairy stores.
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/dairy/stores",
                                "/api/dairy/stores/**"
                        ).permitAll()

                        // Any signed-in user can register a dairy store.
                        // No FARMER role is required.
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/dairy/stores"
                        ).authenticated()

                        // Any signed-in user can view their own stores.
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/dairy/stores/mine"
                        ).authenticated()

                        // Any signed-in user may attempt an update;
                        // DairyStoreService must enforce ownership.
                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/dairy/stores/*"
                        ).authenticated()




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
                        // PUBLIC PRODUCTS
                        // ------------------------------------------------

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/products",
                                "/api/products/**"
                        ).permitAll()


                        // ------------------------------------------------
                        // FARMER
                        // ------------------------------------------------

                        .requestMatchers(
                                "/api/products/farmer",
                                "/api/products/farmer/**"
                        ).hasRole("FARMER")


                        // ------------------------------------------------
                        // ADMIN
                        // ------------------------------------------------

                        .requestMatchers(
                                "/api/admin/**"
                        ).hasRole("ADMIN")


                        // ------------------------------------------------
                        // SWAGGER
                        // ------------------------------------------------

                        .requestMatchers(
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/v3/api-docs/**"
                        ).permitAll()


                        // ------------------------------------------------
                        // EVERYTHING ELSE
                        // ------------------------------------------------

                        .anyRequest().authenticated()
                )


                // ------------------------------------------------
                // FIREBASE AUTH FILTER
                // ------------------------------------------------

                .addFilterBefore(
                        firebaseAuthFilter,
                        UsernamePasswordAuthenticationFilter.class
                );


        return http.build();
    }


    // ============================================================
    // CORS CONFIGURATION
    // ============================================================

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration =
                new CorsConfiguration();

        List<String> allowedOrigins =
                Arrays.stream(frontendUrl.split(","))
                        .map(String::trim)
                        .filter(origin -> !origin.isBlank())
                        .toList();

        configuration.setAllowedOrigins(allowedOrigins);

        configuration.setAllowedMethods(
                List.of(
                        "GET",
                        "POST",
                        "PUT",
                        "PATCH",
                        "DELETE",
                        "OPTIONS"
                )
        );

        configuration.setAllowedHeaders(
                List.of("*")
        );

        configuration.setAllowCredentials(true);

        configuration.setMaxAge(3600L);


        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
                "/**",
                configuration
        );

        return source;
    }
}
