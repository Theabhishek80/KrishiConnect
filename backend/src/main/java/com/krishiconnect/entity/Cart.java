package com.krishiconnect.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
@Entity @Table(name="carts")
@Getter @Setter @NoArgsConstructor
public class Cart {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @OneToOne(optional=false,fetch=FetchType.LAZY) @JoinColumn(name="user_id",unique=true) private User user;
 @Column(name="updated_at",nullable=false) private Instant updatedAt=Instant.now();
}
