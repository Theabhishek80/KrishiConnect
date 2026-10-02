package com.krishiconnect.controller;

import com.krishiconnect.entity.Advertisement;
import com.krishiconnect.service.AdvertisementService;

import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api")
public class AdvertisementController {

    private final AdvertisementService service;

    public AdvertisementController(
            AdvertisementService service
    ) {
        this.service = service;
    }

    // =========================================================
    // PUBLIC
    // =========================================================

    @GetMapping("/advertisements")
    public List<Advertisement> getActiveAdvertisements() {
        return service.getActiveAdvertisements();
    }

    // =========================================================
    // ADMIN
    // =========================================================

    @GetMapping("/admin/advertisements")
    @PreAuthorize("hasRole('ADMIN')")
    public List<Advertisement> getAllAdvertisements() {
        return service.getAllAdvertisements();
    }

    @PostMapping(
            value = "/admin/advertisements",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    @PreAuthorize("hasRole('ADMIN')")
    public Advertisement createAdvertisement(
            @RequestParam("image") MultipartFile image,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String linkUrl,
            @RequestParam(defaultValue = "true") boolean active
    ) {
        return service.create(
                image,
                title,
                linkUrl,
                active
        );
    }

    @PatchMapping("/admin/advertisements/{id}/toggle")
    @PreAuthorize("hasRole('ADMIN')")
    public Advertisement toggleAdvertisement(
            @PathVariable Long id
    ) {
        return service.toggle(id);
    }

    @DeleteMapping("/admin/advertisements/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteAdvertisement(
            @PathVariable Long id
    ) {
        service.delete(id);
    }
}
