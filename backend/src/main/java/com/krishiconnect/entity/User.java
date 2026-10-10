package com.krishiconnect.entity;

import com.krishiconnect.domain.Role;
import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @JsonIgnore
    @Column(name = "password_hash", nullable = true)
    private String passwordHash;

  @Column(name = "firebase_uid", unique = true, length = 128)
private String firebaseUid;

@Column(name = "profile_image_url")
private String profileImageUrl;

@Column(name = "phone", length = 40)
private String phone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Column(nullable = false)
    private boolean enabled = true;

    @Column(name = "email_verified", nullable = false)
    private boolean emailVerified = false;

    /** Show order updates in the in-app notification bell. */
    @Column(name = "notify_orders", nullable = false)
    private boolean notifyOrders = true;

    /** Also e-mail order updates. */
    @Column(name = "notify_email", nullable = false)
    private boolean notifyEmail = true;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();
}

