package com.krishiconnect.security;

public record FirebaseIdentity(
        String uid,
        boolean emailVerified
) {
}
