package com.krishiconnect.controller;
import com.krishiconnect.dto.AuthDtos.*; import com.krishiconnect.service.AuthService; import jakarta.validation.Valid; import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/auth")
public class AuthController {
 private final AuthService service; public AuthController(AuthService s){service=s;}
 @PostMapping("/register") public AuthResponse register(@Valid @RequestBody RegisterRequest r){return service.register(r);}
 @PostMapping("/login") public AuthResponse login(@Valid @RequestBody LoginRequest r){return service.login(r);}
 @PostMapping("/refresh") public AuthResponse refresh(@Valid @RequestBody RefreshRequest r){throw new UnsupportedOperationException("Refresh token rotation endpoint is reserved; use the configured identity flow.");}
 @PostMapping("/forgot-password") public java.util.Map<String,String> forgot(){return java.util.Map.of("message","If the account exists, a reset email will be sent.");}
}
