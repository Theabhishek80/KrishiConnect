package com.krishiconnect.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/** A blog article managed by the admin. Maps to the "blogs" table (migration V13). */
@Entity
@Table(name = "blogs")
@Getter
@Setter
@NoArgsConstructor
public class Blog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 180)
    private String slug;

    @Column(nullable = false, length = 160)
    private String title;

    @Column(length = 500)
    private String excerpt;

    @Column(length = 60)
    private String category;

    @Column(name = "read_time", length = 40)
    private String readTime;

    @Column(length = 16)
    private String emoji;

    @Column(nullable = false)
    private int tone = 1;

    @Column(name = "image_url", columnDefinition = "text")
    private String imageUrl;

    /** One paragraph per line. A line starting with "## " is shown as a heading. */
    @Column(nullable = false, columnDefinition = "text")
    private String body;

    @Column(nullable = false)
    private boolean published = true;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 0;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();
}
