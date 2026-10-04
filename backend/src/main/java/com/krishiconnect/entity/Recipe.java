package com.krishiconnect.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "recipes")
@Getter
@Setter
@NoArgsConstructor
public class Recipe {

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

    @Column(length = 40)
    private String serves;

    @Column(length = 20)
    private String level;

    @Column(length = 16)
    private String emoji;

    @Column(nullable = false)
    private int tone = 1;

    @Column(name = "image_url")
    private String imageUrl;

    /** One ingredient per line. */
    @Column(nullable = false)
    private String ingredients;

    /** One step per line. */
    @Column(nullable = false)
    private String steps;

    @Column(nullable = false)
    private boolean published = true;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 0;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();
}
