package com.krishiconnect.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "dairy_products")
@Getter
@Setter
@NoArgsConstructor
public class DairyProduct {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "store_id", nullable = false)
    private DairyStore store;

    @Column(nullable = false, length = 180)
    private String name;

    @Column(columnDefinition = "text")
    private String description;

    // MILK, CURD, GHEE, PANEER, BUTTER, BUTTERMILK, OTHER
    @Column(nullable = false, length = 30)
    private String category = "MILK";

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Column(nullable = false, length = 40)
    private String unit = "litre";

    @Column(name = "stock_quantity", nullable = false, precision = 10, scale = 2)
    private BigDecimal stockQuantity = BigDecimal.ZERO;

    @Column(nullable = false)
    private boolean available = true;

    @Column(name = "subscription_enabled", nullable = false)
    private boolean subscriptionEnabled = false;

    @Column(name = "subscription_quantity_per_day", precision = 8, scale = 2)
    private BigDecimal subscriptionQuantityPerDay;

    @Column(name = "monthly_subscription_price", precision = 12, scale = 2)
    private BigDecimal monthlySubscriptionPrice;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
