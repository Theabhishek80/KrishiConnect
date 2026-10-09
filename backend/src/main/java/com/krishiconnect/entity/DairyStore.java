
package com.krishiconnect.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(
    name = "dairy_stores",
    indexes = {
        @Index(name = "idx_dairy_stores_owner", columnList = "owner_id"),
        @Index(name = "idx_dairy_stores_location", columnList = "city, state"),
        @Index(name = "idx_dairy_stores_postal_code", columnList = "postal_code")
    }
)
@Getter
@Setter
@NoArgsConstructor
public class DairyStore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The authenticated farmer or producer who owns this store.
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(name = "store_name", nullable = false, length = 180)
    private String storeName;

    @Column(columnDefinition = "text")
    private String description;

    @Column(name = "phone", length = 40)
    private String phone;

    @Column(name = "address_line", nullable = false, length = 255)
    private String addressLine;

    @Column(nullable = false, length = 100)
    private String city;

    @Column(nullable = false, length = 100)
    private String state;

    @Column(name = "postal_code", nullable = false, length = 20)
    private String postalCode;

    // Optional coordinates for nearby-store discovery.
    private Double latitude;

    private Double longitude;

    @Column(name = "delivery_radius_km")
    private Double deliveryRadiusKm = 5.0;

    // Examples: MONDAY,TUESDAY,WEDNESDAY
    @Column(name = "operating_days", length = 200)
    private String operatingDays;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();

        if (createdAt == null) {
            createdAt = now;
        }

        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
