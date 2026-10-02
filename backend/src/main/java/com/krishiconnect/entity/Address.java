package com.krishiconnect.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "addresses")
@Getter @Setter @NoArgsConstructor
public class Address {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    @Column(nullable = false) private String label;
    @Column(name = "recipient_name", nullable = false) private String recipientName;
    @Column(nullable = false) private String phone;
    @Column(nullable = false) private String line1;
    private String line2;
    @Column(nullable = false) private String city;
    @Column(nullable = false) private String state;
    @Column(name = "postal_code", nullable = false) private String postalCode;
    @Column(nullable = false) private String country = "India";
    @Column(name = "is_default", nullable = false) private boolean defaultAddress;
}
