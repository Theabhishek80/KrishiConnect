package com.krishiconnect.controller;

import com.krishiconnect.entity.Blog;
import com.krishiconnect.repository.BlogRepository;
import com.krishiconnect.service.ImageKitService;

import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.text.Normalizer;
import java.time.Instant;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.NoSuchElementException;

/**
 * Public:  GET /api/blogs            published blogs (newest first)
 *          GET /api/blogs/{slug}     one blog
 * Admin:   /api/admin/blogs          create / edit / hide / delete
 *
 * The article body is sent as text with ONE PARAGRAPH PER LINE.
 */
@RestController
public class BlogController {

    private static final int MAX_BODY = 30000;

    private final BlogRepository blogs;
    private final ImageKitService imageKit;

    public BlogController(BlogRepository blogs, ImageKitService imageKit) {
        this.blogs = blogs;
        this.imageKit = imageKit;
    }

    // ------------------------------------------------------------
    // PUBLIC
    // ------------------------------------------------------------

    @GetMapping("/api/blogs")
    public List<Map<String, Object>> list() {
        return blogs.findByPublishedTrueOrderBySortOrderAscIdDesc()
                .stream().map(this::toDto).toList();
    }

    @GetMapping("/api/blogs/{slug}")
    public Map<String, Object> one(@PathVariable String slug) {
        return toDto(blogs.findBySlugAndPublishedTrue(slug)
                .orElseThrow(() -> new NoSuchElementException("Blog not found.")));
    }

    // ------------------------------------------------------------
    // ADMIN
    // ------------------------------------------------------------

    @GetMapping("/api/admin/blogs")
    @PreAuthorize("hasRole('ADMIN')")
    public List<Map<String, Object>> adminList() {
        return blogs.findAllByOrderBySortOrderAscIdDesc()
                .stream().map(this::toDto).toList();
    }

    @PostMapping(value = "/api/admin/blogs",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> create(
            @RequestParam("title") String title,
            @RequestParam("body") String body,
            @RequestParam(value = "excerpt", required = false) String excerpt,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "readTime", required = false) String readTime,
            @RequestParam(value = "emoji", required = false) String emoji,
            @RequestParam(value = "published", defaultValue = "true") boolean published,
            @RequestParam(value = "image", required = false) MultipartFile image
    ) {
        Blog b = new Blog();

        apply(b, title, body, excerpt, category, readTime, emoji);

        b.setSlug(uniqueSlug(title));
        b.setTone((int) (blogs.count() % 6) + 1);
        b.setPublished(published);
        b.setSortOrder(0); // newest posts show first

        if (image != null && !image.isEmpty()) {
            b.setImageUrl(imageKit.uploadBlogImage(image));
        }

        return toDto(blogs.save(b));
    }

    @PutMapping(value = "/api/admin/blogs/{id}",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> update(
            @PathVariable Long id,
            @RequestParam("title") String title,
            @RequestParam("body") String body,
            @RequestParam(value = "excerpt", required = false) String excerpt,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "readTime", required = false) String readTime,
            @RequestParam(value = "emoji", required = false) String emoji,
            @RequestParam(value = "published", required = false) Boolean published,
            @RequestParam(value = "removeImage", defaultValue = "false") boolean removeImage,
            @RequestParam(value = "image", required = false) MultipartFile image
    ) {
        Blog b = blogs.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Blog not found."));

        apply(b, title, body, excerpt, category, readTime, emoji);

        if (published != null) {
            b.setPublished(published);
        }

        if (image != null && !image.isEmpty()) {
            b.setImageUrl(imageKit.uploadBlogImage(image));
        } else if (removeImage) {
            b.setImageUrl(null);
        }

        b.setUpdatedAt(Instant.now());

        return toDto(blogs.save(b));
    }

    @PatchMapping("/api/admin/blogs/{id}/toggle")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> toggle(@PathVariable Long id) {
        Blog b = blogs.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Blog not found."));
        b.setPublished(!b.isPublished());
        b.setUpdatedAt(Instant.now());
        return toDto(blogs.save(b));
    }

    @DeleteMapping("/api/admin/blogs/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, String> delete(@PathVariable Long id) {
        if (!blogs.existsById(id)) {
            throw new NoSuchElementException("Blog not found.");
        }
        blogs.deleteById(id);
        return Map.of("message", "Blog deleted.");
    }

    // ------------------------------------------------------------
    // helpers
    // ------------------------------------------------------------

    private void apply(
            Blog b, String title, String body, String excerpt,
            String category, String readTime, String emoji
    ) {
        String cleanTitle = clean(title);
        if (cleanTitle == null) {
            throw new IllegalArgumentException("Blog title is required.");
        }
        if (cleanTitle.length() > 160) {
            throw new IllegalArgumentException("Title must be 160 characters or fewer.");
        }

        String text = lines(body);

        if (text.isEmpty()) {
            throw new IllegalArgumentException("Write the blog content (one paragraph per line).");
        }
        if (text.length() > MAX_BODY) {
            throw new IllegalArgumentException("The blog is too long. Keep it under " + MAX_BODY + " characters.");
        }

        b.setTitle(cleanTitle);
        b.setBody(text);
        b.setExcerpt(limit(clean(excerpt), 500));
        b.setCategory(limit(clean(category), 60));
        b.setReadTime(limit(clean(readTime), 40));

        String e = clean(emoji);
        b.setEmoji(e == null ? "📝" : limit(e, 16));
    }

    private String uniqueSlug(String title) {
        String normalized = Normalizer.normalize(title, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "");

        String base = normalized.isEmpty() ? "blog" : normalized;
        if (base.length() > 150) base = base.substring(0, 150);

        String slug = base;
        int n = 2;
        while (blogs.existsBySlug(slug)) {
            slug = base + "-" + n++;
        }
        return slug;
    }

    private String lines(String value) {
        if (value == null) return "";
        return String.join("\n",
                Arrays.stream(value.split("\\r?\\n"))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .toList());
    }

    private String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String limit(String value, int max) {
        return value == null || value.length() <= max ? value : value.substring(0, max);
    }

    private List<String> split(String value) {
        return value == null || value.isEmpty()
                ? List.of()
                : Arrays.asList(value.split("\\n"));
    }

    private Map<String, Object> toDto(Blog b) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", b.getId());
        map.put("slug", b.getSlug());
        map.put("title", b.getTitle());
        map.put("excerpt", b.getExcerpt() == null ? "" : b.getExcerpt());
        map.put("category", b.getCategory() == null ? "Blog" : b.getCategory());
        map.put("readTime", b.getReadTime() == null ? "" : b.getReadTime());
        map.put("emoji", b.getEmoji() == null ? "📝" : b.getEmoji());
        map.put("tone", b.getTone());
        map.put("imageUrl", b.getImageUrl() == null ? "" : b.getImageUrl());
        map.put("body", split(b.getBody()));
        map.put("published", b.isPublished());
        map.put("createdAt", b.getCreatedAt().toString());
        return map;
    }
}
