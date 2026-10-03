package com.krishiconnect.config;

import com.krishiconnect.domain.Role;
import com.krishiconnect.entity.User;
import com.krishiconnect.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class AdminInitializer {
    @Bean
    CommandLineRunner createConfiguredAdmin(UserRepository users, PasswordEncoder encoder,
                                             @Value("${app.admin.email}") String email,
                                             @Value("${app.admin.password}") String password) {
        return args -> {
            if (users.findByEmailIgnoreCase(email).isEmpty()) {
                User admin = new User();
                admin.setName("KrishiConnect Admin");
                admin.setEmail(email.toLowerCase());
                admin.setPasswordHash(encoder.encode(password));
                admin.setRole(Role.ADMIN);
                admin.setEnabled(true);
                admin.setEmailVerified(true);
                users.save(admin);
            }
        };
    }
}
