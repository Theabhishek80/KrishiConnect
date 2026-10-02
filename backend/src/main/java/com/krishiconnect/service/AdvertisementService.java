package com.krishiconnect.service;

import com.krishiconnect.entity.Advertisement;
import com.krishiconnect.repository.AdvertisementRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.List;

@Service
public class AdvertisementService {

    private static final int MAX_ACTIVE_ADVERTISEMENTS = 5;

    private final AdvertisementRepository advertisements;
    private final ImageKitService imageKitService;

    public AdvertisementService(
            AdvertisementRepository advertisements,
            ImageKitService imageKitService
    ) {
        this.advertisements = advertisements;
        this.imageKitService = imageKitService;
    }

    @Transactional(readOnly = true)
    public List<Advertisement> getActiveAdvertisements() {
        return advertisements.findByActiveTrueOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public List<Advertisement> getAllAdvertisements() {
        return advertisements.findAll(
                org.springframework.data.domain.Sort.by(
                        org.springframework.data.domain.Sort.Direction.DESC,
                        "createdAt"
                )
        );
    }

    @Transactional
    public Advertisement create(
            MultipartFile image,
            String title,
            String linkUrl,
            boolean active
    ) {
        if (active &&
                advertisements.countByActiveTrue()
                        >= MAX_ACTIVE_ADVERTISEMENTS) {

            throw new IllegalStateException(
                    "Maximum 5 active advertisements are allowed."
            );
        }

        Advertisement advertisement = new Advertisement();

        advertisement.setImageUrl(
                uploadImage(image)
        );

        advertisement.setTitle(
                clean(title)
        );

        advertisement.setLinkUrl(
                clean(linkUrl)
        );

        advertisement.setActive(active);

        return advertisements.save(advertisement);
    }

    @Transactional
    public Advertisement toggle(Long id) {
        Advertisement advertisement =
                advertisements.findById(id)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Advertisement not found."
                                )
                        );

        if (!advertisement.isActive() &&
                advertisements.countByActiveTrue()
                        >= MAX_ACTIVE_ADVERTISEMENTS) {

            throw new IllegalStateException(
                    "Maximum 5 active advertisements are allowed."
            );
        }

        advertisement.setActive(
                !advertisement.isActive()
        );

        advertisement.setUpdatedAt(
                Instant.now()
        );

        return advertisements.save(advertisement);
    }

    @Transactional
    public void delete(Long id) {
        Advertisement advertisement =
                advertisements.findById(id)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Advertisement not found."
                                )
                        );

        advertisements.delete(advertisement);
    }

    private String uploadImage(MultipartFile image) {
        if (image == null || image.isEmpty()) {
            throw new IllegalArgumentException(
                    "Advertisement image is required."
            );
        }

        return imageKitService.uploadAdvertisementImage(image);
    }

    private String clean(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }
}
