package com.krishiconnect.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name="cart_items")
@Getter @Setter @NoArgsConstructor
public class CartItem {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @ManyToOne(optional=false,fetch=FetchType.LAZY) @JoinColumn(name="cart_id")
    @JsonBackReference private Cart cart;
    @ManyToOne(optional=false,fetch=FetchType.EAGER) @JoinColumn(name="product_id") private Product product;
    @Column(nullable=false) private int quantity;
}
