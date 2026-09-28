
package com.krishiconnect.entity;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import java.util.ArrayList;
import java.util.List;


import com.krishiconnect.domain.ProductStatus;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
@Entity @Table(name="products")
@Getter @Setter @NoArgsConstructor
public class Product {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @ManyToOne(optional=false,fetch=FetchType.LAZY) @JoinColumn(name="farmer_id") private User farmer;
 @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="category_id") private Category category;
 @Column(nullable=false) private String name;
 @Column(nullable=false,columnDefinition="text") private String description;
 @Column(nullable=false,precision=12,scale=2) private BigDecimal price;
 @Column(nullable=false) private String unit;
 @Enumerated(EnumType.STRING) @Column(nullable=false) private ProductStatus status=ProductStatus.DRAFT;
 @Column(name="created_at",nullable=false) private Instant createdAt=Instant.now();
 @Column(name="updated_at",nullable=false) private Instant updatedAt=Instant.now();
}
