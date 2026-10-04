package com.krishiconnect.entity;
import jakarta.persistence.*;
import lombok.*;
@Entity @Table(name="categories")
@Getter @Setter @NoArgsConstructor
public class Category {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(nullable=false,unique=true) private String name;
 private String description;
 private boolean active=true;
}
