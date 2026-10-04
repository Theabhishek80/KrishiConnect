package com.krishiconnect.controller;

import com.krishiconnect.entity.Recipe;
import com.krishiconnect.repository.RecipeRepository;
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

/**
 * Public:  GET /api/recipes            published recipes (newest first)
 *          GET /api/recipes/{slug}     one recipe
 * Admin:   /api/admin/recipes          create / edit / hide / delete
 *
 * Ingredients and steps are sent as text with ONE ITEM PER LINE.
 */
@RestController
public class RecipeController {

    private final RecipeRepository recipes;
    private final ImageKitService imageKit;

    public RecipeController(RecipeRepository recipes, ImageKitService imageKit) {
        this.recipes = recipes;
        this.imageKit = imageKit;
    }

    // ------------------------------------------------------------
    // PUBLIC
    // ------------------------------------------------------------

    @GetMapping("/api/recipes")
    public List<Map<String, Object>> list() {
        return recipes.findByPublishedTrueOrderBySortOrderAscIdDesc()
                .stream().map(this::toDto).toList();
    }

    @GetMapping("/api/recipes/{slug}")
    public Map<String, Object> one(@PathVariable String slug) {
        return toDto(recipes.findBySlugAndPublishedTrue(slug)
                .orElseThrow(() -> new IllegalArgumentException("Recipe not found.")));
    }

    // ------------------------------------------------------------
    // ADMIN
    // ------------------------------------------------------------

    @GetMapping("/api/admin/recipes")
    @PreAuthorize("hasRole('ADMIN')")
    public List<Map<String, Object>> adminList() {
        return recipes.findAllByOrderBySortOrderAscIdDesc()
                .stream().map(this::toDto).toList();
    }

    @PostMapping(value = "/api/admin/recipes",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> create(
            @RequestParam("title") String title,
            @RequestParam("ingredients") String ingredients,
            @RequestParam("steps") String steps,
            @RequestParam(value = "excerpt", required = false) String excerpt,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "readTime", required = false) String readTime,
            @RequestParam(value = "serves", required = false) String serves,
            @RequestParam(value = "level", required = false) String level,
            @RequestParam(value = "emoji", required = false) String emoji,
            @RequestParam(value = "published", defaultValue = "true") boolean published,
            @RequestParam(value = "image", required = false) MultipartFile image
    ) {
        Recipe r = new Recipe();

        apply(r, title, ingredients, steps, excerpt, category,
                readTime, serves, level, emoji);

        r.setSlug(uniqueSlug(title));
        r.setTone((int) (recipes.count() % 6) + 1);
        r.setPublished(published);
        r.setSortOrder(0); // newest posts show first

        if (image != null && !image.isEmpty()) {
            r.setImageUrl(imageKit.uploadRecipeImage(image));
        }

        return toDto(recipes.save(r));
    }

    @PutMapping(value = "/api/admin/recipes/{id}",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> update(
            @PathVariable Long id,
            @RequestParam("title") String title,
            @RequestParam("ingredients") String ingredients,
            @RequestParam("steps") String steps,
            @RequestParam(value = "excerpt", required = false) String excerpt,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "readTime", required = false) String readTime,
            @RequestParam(value = "serves", required = false) String serves,
            @RequestParam(value = "level", required = false) String level,
            @RequestParam(value = "emoji", required = false) String emoji,
            @RequestParam(value = "published", required = false) Boolean published,
            @RequestParam(value = "removeImage", defaultValue = "false") boolean removeImage,
            @RequestParam(value = "image", required = false) MultipartFile image
    ) {
        Recipe r = recipes.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Recipe not found."));

        apply(r, title, ingredients, steps, excerpt, category,
                readTime, serves, level, emoji);

        if (published != null) {
            r.setPublished(published);
        }

        if (image != null && !image.isEmpty()) {
            r.setImageUrl(imageKit.uploadRecipeImage(image));
        } else if (removeImage) {
            r.setImageUrl(null);
        }

        r.setUpdatedAt(Instant.now());

        return toDto(recipes.save(r));
    }

    @PatchMapping("/api/admin/recipes/{id}/toggle")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> toggle(@PathVariable Long id) {
        Recipe r = recipes.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Recipe not found."));
        r.setPublished(!r.isPublished());
        r.setUpdatedAt(Instant.now());
        return toDto(recipes.save(r));
    }

    @DeleteMapping("/api/admin/recipes/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, String> delete(@PathVariable Long id) {
        if (!recipes.existsById(id)) {
            throw new IllegalArgumentException("Recipe not found.");
        }
        recipes.deleteById(id);
        return Map.of("message", "Recipe deleted.");
    }

    // ------------------------------------------------------------
    // helpers
    // ------------------------------------------------------------

    private void apply(
            Recipe r, String title, String ingredients, String steps,
            String excerpt, String category, String readTime,
            String serves, String level, String emoji
    ) {
        String cleanTitle = clean(title);
        if (cleanTitle == null) {
            throw new IllegalArgumentException("Recipe title is required.");
        }
        if (cleanTitle.length() > 160) {
            throw new IllegalArgumentException("Title must be 160 characters or fewer.");
        }

        String ing = lines(ingredients);
        String stp = lines(steps);

        if (ing.isEmpty()) {
            throw new IllegalArgumentException("Add at least one ingredient (one per line).");
        }
        if (stp.isEmpty()) {
            throw new IllegalArgumentException("Add at least one step (one per line).");
        }

        r.setTitle(cleanTitle);
        r.setIngredients(ing);
        r.setSteps(stp);
        r.setExcerpt(limit(clean(excerpt), 500));
        r.setCategory(limit(clean(category), 60));
        r.setReadTime(limit(clean(readTime), 40));
        r.setServes(limit(clean(serves), 40));
        r.setLevel(limit(clean(level), 20));

        String e = clean(emoji);
        r.setEmoji(e == null ? "🍲" : limit(e, 16));
    }

    private String uniqueSlug(String title) {
        String normalized = Normalizer.normalize(title, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "");

        String base = normalized.isEmpty() ? "recipe" : normalized;
        if (base.length() > 150) base = base.substring(0, 150);

        String slug = base;
        int n = 2;
        while (recipes.existsBySlug(slug)) {
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

    private Map<String, Object> toDto(Recipe r) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", r.getId());
        map.put("slug", r.getSlug());
        map.put("title", r.getTitle());
        map.put("excerpt", r.getExcerpt() == null ? "" : r.getExcerpt());
        map.put("category", r.getCategory() == null ? "Recipe" : r.getCategory());
        map.put("readTime", r.getReadTime() == null ? "" : r.getReadTime());
        map.put("serves", r.getServes() == null ? "" : r.getServes());
        map.put("level", r.getLevel() == null ? "" : r.getLevel());
        map.put("emoji", r.getEmoji() == null ? "🍲" : r.getEmoji());
        map.put("tone", r.getTone());
        map.put("imageUrl", r.getImageUrl() == null ? "" : r.getImageUrl());
        map.put("ingredients", split(r.getIngredients()));
        map.put("steps", split(r.getSteps()));
        map.put("published", r.isPublished());
        map.put("createdAt", r.getCreatedAt().toString());
        return map;
    }
}
