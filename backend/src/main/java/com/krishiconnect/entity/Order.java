package com.krishiconnect.entity;
import com.krishiconnect.domain.OrderStatus;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
@Entity @Table(name="orders")
@Getter @Setter @NoArgsConstructor
public class Order {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="consumer_id",nullable=false) private User consumer;
 @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="farmer_id",nullable=false) private User farmer;
 @Enumerated(EnumType.STRING) @Column(nullable=false) private OrderStatus status=OrderStatus.PLACED;
 @Column(nullable=false,precision=12,scale=2) private BigDecimal totalAmount;
 @Column(nullable=false,columnDefinition="text") private String shippingAddress;
 @Column(name="created_at",nullable=false) private Instant createdAt=Instant.now();
 @Column(name="updated_at",nullable=false) private Instant updatedAt=Instant.now();
}
