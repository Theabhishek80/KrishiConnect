package com.krishiconnect.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "dairy_orders")
@Getter
@Setter
@NoArgsConstructor
public class DairyOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "store_id", nullable = false)
    private DairyStore store;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private DairyProduct product;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "consumer_id", nullable = false)
    private User consumer;

    @Column(name = "product_name", nullable = false, length = 180)
    private String productName;

    @Column(nullable = false, length = 40)
    private String unit;

    @Column(name = "unit_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal quantity;

    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "delivery_address", nullable = false, columnDefinition = "text")
    private String deliveryAddress;

    @Column(nullable = false, length = 40)
    private String phone;

    @Column(columnDefinition = "text")
    private String note;

    @Column(name = "payment_method", nullable = false, length = 20)
    private String paymentMethod = "COD";

    // PLACED, CONFIRMED, OUT_FOR_DELIVERY, DELIVERED, CANCELLED
    @Column(nullable = false, length = 25)
    private String status = "PLACED";

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
