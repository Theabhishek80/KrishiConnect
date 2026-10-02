package com.krishiconnect.service;

import com.krishiconnect.domain.Role;
import com.krishiconnect.entity.User;
import com.krishiconnect.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FirebaseUserService {

    private final UserRepository users;

    public FirebaseUserService(UserRepository users) {
        this.users = users;
    }

    @Transactional
    public User getOrCreateUser(
            String firebaseUid,
            String email,
            String name,
            Role requestedRole,
            boolean emailVerified
    ) {

        // 1. First find by Firebase UID
        User user = users.findByFirebaseUid(firebaseUid)
                .orElse(null);

        if (user != null) {
            // Existing user: Firebase is the source of authentication.
            user.setEmailVerified(emailVerified);

            if (name != null && !name.isBlank()) {
                user.setName(name.trim());
            }

            return users.save(user);
        }

        // 2. If Firebase UID is not linked, try email
        user = users.findByEmailIgnoreCase(email)
                .orElse(null);

        if (user != null) {
            // Link the existing PostgreSQL account to Firebase.
            user.setFirebaseUid(firebaseUid);
            user.setEmailVerified(emailVerified);

            if (name != null && !name.isBlank()) {
                user.setName(name.trim());
            }

            return users.save(user);
        }

        // 3. Completely new Firebase user
        if (requestedRole == null) {
            throw new IllegalArgumentException(
                    "Role is required when creating a new account."
            );
        }

        // Never allow a public Firebase registration to create an ADMIN.
        if (requestedRole == Role.ADMIN) {
            throw new IllegalArgumentException(
                    "ADMIN accounts cannot be created through registration."
            );
        }

        User newUser = new User();

        newUser.setFirebaseUid(firebaseUid);
        newUser.setEmail(email);
        newUser.setName(
                name == null || name.isBlank()
                        ? email
                        : name.trim()
        );
        newUser.setRole(requestedRole);
        newUser.setEnabled(true);
        newUser.setEmailVerified(emailVerified);

        // Firebase manages the password.
        newUser.setPasswordHash(null);

        return users.save(newUser);
    }
}
