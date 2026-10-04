package com.krishiconnect.entity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
@Entity @Table(name="order_items")
@Getter @Setter @NoArgsConstructor
public class OrderItem {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @ManyToOne(optional=false,fetch=FetchType.LAZY) @JoinColumn(name="order_id") private Order order;
 @ManyToOne(optional=false,fetch=FetchType.LAZY) @JoinColumn(name="product_id") private Product product;
 @Column(nullable=false) private String productName;
 @Column(nullable=false,precision=12,scale=2) private BigDecimal unitPrice;
 @Column(nullable=false) private int quantity;
 @Column(nullable=false,precision=12,scale=2) private BigDecimal lineTotal;
}
