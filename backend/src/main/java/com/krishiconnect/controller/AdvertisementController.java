package com.krishiconnect.controller;

import com.krishiconnect.entity.Advertisement;
import com.krishiconnect.repository.AdvertisementRepository;
import com.krishiconnect.service.ImageKitService;

import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

/**
 * Public ad feed:  GET /api/advertisements
 * Admin management: /api/admin/advertisements
 */
@RestController
public class AdvertisementController {

    private static final int MAX_ACTIVE = 5;

    private final AdvertisementRepository ads;
    private final ImageKitService imageKit;

    public AdvertisementController(
            AdvertisementRepository ads,
            ImageKitService imageKit
    ) {
        this.ads = ads;
        this.imageKit = imageKit;
    }

    // ------------------------------------------------------------
    // PUBLIC
    // ------------------------------------------------------------

    @GetMapping("/api/advertisements")
    public List<Map<String, Object>> publicAds() {
        return ads.findByActiveTrueOrderBySortOrderAscIdDesc()
                .stream()
                .map(this::toDto)
                .toList();
    }

    // ------------------------------------------------------------
    // ADMIN
    // ------------------------------------------------------------

    @GetMapping("/api/admin/advertisements")
    @PreAuthorize("hasRole('ADMIN')")
    public List<Map<String, Object>> adminAds() {
        return ads.findAllByOrderByIdDesc()
                .stream()
                .map(this::toDto)
                .toList();
    }

    @PostMapping(
            value = "/api/admin/advertisements",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> create(
            @RequestParam("image") MultipartFile image,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "linkUrl", required = false) String linkUrl,
            @RequestParam(value = "active", defaultValue = "true") boolean active
    ) {
        if (active && ads.countByActiveTrue() >= MAX_ACTIVE) {
            throw new IllegalArgumentException(
                    "You can have at most " + MAX_ACTIVE
                            + " active advertisements. Deactivate one first."
            );
        }

        String imageUrl = imageKit.uploadAdvertisementImage(image);

        Advertisement ad = new Advertisement();
        ad.setTitle(clean(title));
        ad.setLinkUrl(clean(linkUrl));
        ad.setImageUrl(imageUrl);
        ad.setActive(active);

        return toDto(ads.save(ad));
    }

    @PatchMapping("/api/admin/advertisements/{id}/toggle")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> toggle(@PathVariable Long id) {
        Advertisement ad = ads.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Advertisement not found."));

        if (!ad.isActive() && ads.countByActiveTrue() >= MAX_ACTIVE) {
            throw new IllegalArgumentException(
                    "You can have at most " + MAX_ACTIVE
                            + " active advertisements. Deactivate one first."
            );
        }

        ad.setActive(!ad.isActive());
        return toDto(ads.save(ad));
    }

    @DeleteMapping("/api/admin/advertisements/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, String> delete(@PathVariable Long id) {
        if (!ads.existsById(id)) {
            throw new IllegalArgumentException("Advertisement not found.");
        }
        ads.deleteById(id);
        return Map.of("message", "Advertisement deleted.");
    }

    // ------------------------------------------------------------

    private String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private Map<String, Object> toDto(Advertisement ad) {
        // HashMap-style via Map.of cannot hold nulls, so build explicitly.
        var map = new java.util.LinkedHashMap<String, Object>();
        map.put("id", ad.getId());
        map.put("title", ad.getTitle() == null ? "" : ad.getTitle());
        map.put("imageUrl", ad.getImageUrl());
        map.put("linkUrl", ad.getLinkUrl() == null ? "" : ad.getLinkUrl());
        map.put("active", ad.isActive());
        map.put("sortOrder", ad.getSortOrder());
        return map;
    }
}
