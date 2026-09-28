package com.krishiconnect.service;
import com.krishiconnect.domain.Role;
import com.krishiconnect.dto.AuthDtos.*;
import com.krishiconnect.entity.User;
import com.krishiconnect.repository.UserRepository;
import com.krishiconnect.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;

@Service
public class AuthService {
 private final UserRepository users; private final PasswordEncoder encoder; private final JwtService jwt;
 public AuthService(UserRepository users,PasswordEncoder encoder,JwtService jwt) {this.users=users;this.encoder=encoder;this.jwt=jwt;}
 @Transactional public AuthResponse register(RegisterRequest r) {
   if(users.findByEmailIgnoreCase(r.email()).isPresent()) throw new IllegalArgumentException("Email already registered");
   Role role; try { role=Role.valueOf(r.role().toUpperCase()); } catch(Exception e) { role=Role.CONSUMER; }
   if(role==Role.ADMIN) throw new IllegalArgumentException("Admin registration is not public");
   User u=new User(); u.setName(r.name());u.setEmail(r.email().toLowerCase());u.setPasswordHash(encoder.encode(r.password()));u.setRole(role);users.save(u);
   return response(u);
 }
 public AuthResponse login(LoginRequest r) {
   User u=users.findByEmailIgnoreCase(r.email()).orElseThrow(()->new IllegalArgumentException("Invalid credentials"));
   if(!encoder.matches(r.password(),u.getPasswordHash())) throw new IllegalArgumentException("Invalid credentials");
   return response(u);
 }
 private AuthResponse response(User u) { return new AuthResponse(jwt.create(u.getId(),u.getEmail(),u.getRole().name()),UUID.randomUUID().toString(),"Bearer",u.getId(),u.getName(),u.getRole().name()); }
}
