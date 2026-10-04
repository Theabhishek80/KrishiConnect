package com.krishiconnect.entity;
import jakarta.persistence.*;
import lombok.*;
@Entity @Table(name="inventory")
@Getter @Setter @NoArgsConstructor
public class Inventory {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @OneToOne(optional=false,fetch=FetchType.LAZY) @JoinColumn(name="product_id",unique=true) private Product product;
 @Column(nullable=false) private int quantity;
 @Version private long version;
}
