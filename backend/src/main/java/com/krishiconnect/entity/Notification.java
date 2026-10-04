package com.krishiconnect.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
@Entity @Table(name="notifications")
@Getter @Setter @NoArgsConstructor
public class Notification {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @ManyToOne(optional=false,fetch=FetchType.LAZY) @JoinColumn(name="user_id") private User user;
 @Column(nullable=false) private String title;
 @Column(nullable=false,columnDefinition="text") private String message;
 @Column(nullable=false) private String type;
 @Column(name="read_at") private Instant readAt;
 @Column(name="created_at",nullable=false) private Instant createdAt=Instant.now();
}
