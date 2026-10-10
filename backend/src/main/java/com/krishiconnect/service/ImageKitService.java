package com.krishiconnect.service;

import io.imagekit.client.ImageKitClient;
import io.imagekit.client.okhttp.ImageKitOkHttpClient;
import io.imagekit.models.files.FileUploadParams;
import io.imagekit.models.files.FileUploadResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Objects;

@Service
public class ImageKitService {

    private static final Logger log =
            LoggerFactory.getLogger(ImageKitService.class);

    // Spring resolves this from Railway/Render environment variables or the
    // optional Spring-imported .env file. Do not rely on System.getenv() here:
    // ImageKit's fromEnv() cannot see values loaded by Spring from .env.
    @Value("${IMAGEKIT_PRIVATE_KEY:}")
    private String privateKey;

    private volatile ImageKitClient imageKitClient;

    public boolean isConfigured() {
        return privateKey != null && !privateKey.isBlank();
    }

    private ImageKitClient client() {
        ImageKitClient local = imageKitClient;
        if (local == null) {
            synchronized (this) {
                if (imageKitClient == null) {
                    if (!isConfigured()) {
                        throw new IllegalStateException(
                                "Image uploads are not configured. Set IMAGEKIT_PRIVATE_KEY.");
                    }

                    try {
                        imageKitClient = ImageKitOkHttpClient.builder()
                                .privateKey(privateKey.trim())
                                .build();
                    } catch (Exception e) {
                        throw new IllegalStateException(
                                "ImageKit could not be initialized. Check IMAGEKIT_PRIVATE_KEY.",
                                e);
                    }
                }
                local = imageKitClient;
            }
        }
        return local;
    }

    public String uploadProductImage(MultipartFile image, Long productId) {
        if (image == null || image.isEmpty()) {
            throw new IllegalArgumentException("Image file is required.");
        }

        String contentType = image.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Only image files are allowed.");
        }

        if (image.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException("Image size must be 5 MB or less.");
        }

        String originalName = Objects.requireNonNullElse(image.getOriginalFilename(), "product-image.jpg");
        String fileName = productId + "-" + System.currentTimeMillis() + "-" + originalName;

        try {
            FileUploadParams params = FileUploadParams.builder()
                    .file(image.getBytes())
                    .fileName(fileName)
                    .folder("/products/" + productId)
                    .build();

            FileUploadResponse response = client().files().upload(params);
            return response.url()
        .orElseThrow(() -> new IllegalStateException("ImageKit did not return an image URL."));

        } catch (IOException e) {
            throw new IllegalStateException("Could not read the uploaded image.", e);
        } catch (IllegalStateException e) {
            // already has a clear message (e.g. key not configured)
            log.error("ImageKit upload failed: {}", e.getMessage(), e);
            throw e;
        } catch (Exception e) {
            log.error("ImageKit upload failed", e);
            throw new IllegalStateException("ImageKit upload failed.", e);
        }
    }

    public String uploadProfileImage(MultipartFile image, Long userId) {

    if (image == null || image.isEmpty()) {
        throw new IllegalArgumentException("Profile image is required.");
    }

    String contentType = image.getContentType();

    if (contentType == null || !contentType.startsWith("image/")) {
        throw new IllegalArgumentException("Only image files are allowed.");
    }

    if (image.getSize() > 5 * 1024 * 1024) {
        throw new IllegalArgumentException("Image size must be 5 MB or less.");
    }

    String originalName = Objects.requireNonNullElse(
            image.getOriginalFilename(),
            "profile-image.jpg"
    );

    String fileName =
            userId + "-" +
            System.currentTimeMillis() +
            "-" +
            originalName;

    try {

        FileUploadParams params = FileUploadParams.builder()
                .file(image.getBytes())
                .fileName(fileName)
                .folder("/profiles/" + userId)
                .build();

        FileUploadResponse response =
                client().files().upload(params);

        return response.url()
                .orElseThrow(() ->
                        new IllegalStateException(
                                "ImageKit did not return an image URL."
                        )
                );

    } catch (IOException e) {

        throw new IllegalStateException(
                "Could not read the uploaded image.",
                e
        );

    } catch (IllegalStateException e) {

        // already has a clear message (e.g. key not configured)
        log.error("ImageKit upload failed: {}", e.getMessage(), e);
        throw e;

    } catch (Exception e) {

        log.error("ImageKit upload failed", e);

        throw new IllegalStateException(
                "ImageKit upload failed.",
                e
        );
    }
}

    public String uploadAdvertisementImage(MultipartFile image) {

        if (image == null || image.isEmpty()) {
            throw new IllegalArgumentException("Advertisement image is required.");
        }

        String contentType = image.getContentType();

        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Only image files are allowed.");
        }

        if (image.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException("Image size must be 5 MB or less.");
        }

        String originalName = Objects.requireNonNullElse(
                image.getOriginalFilename(),
                "advertisement.jpg"
        );

        String fileName = System.currentTimeMillis() + "-" + originalName;

        try {

            FileUploadParams params = FileUploadParams.builder()
                    .file(image.getBytes())
                    .fileName(fileName)
                    .folder("/advertisements")
                    .build();

            FileUploadResponse response =
                    client().files().upload(params);

            return response.url()
                    .orElseThrow(() ->
                            new IllegalStateException(
                                    "ImageKit did not return an image URL."
                            )
                    );

        } catch (IOException e) {
            throw new IllegalStateException("Could not read the uploaded image.", e);
        } catch (IllegalStateException e) {
            // already has a clear message (e.g. key not configured)
            log.error("ImageKit upload failed: {}", e.getMessage(), e);
            throw e;
        } catch (Exception e) {
            log.error("ImageKit upload failed", e);
            throw new IllegalStateException("ImageKit upload failed.", e);
        }
    }

    public String uploadRecipeImage(MultipartFile image) {

        if (image == null || image.isEmpty()) {
            throw new IllegalArgumentException("Recipe image is required.");
        }

        String contentType = image.getContentType();

        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Only image files are allowed.");
        }

        if (image.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException("Image size must be 5 MB or less.");
        }

        String originalName = Objects.requireNonNullElse(
                image.getOriginalFilename(), "recipe.jpg");

        String fileName = System.currentTimeMillis() + "-" + originalName;

        try {
            FileUploadParams params = FileUploadParams.builder()
                    .file(image.getBytes())
                    .fileName(fileName)
                    .folder("/recipes")
                    .build();

            FileUploadResponse response = client().files().upload(params);

            return response.url()
                    .orElseThrow(() ->
                            new IllegalStateException("ImageKit did not return an image URL."));

        } catch (IOException e) {
            throw new IllegalStateException("Could not read the uploaded image.", e);
        } catch (IllegalStateException e) {
            // already has a clear message (e.g. key not configured)
            log.error("ImageKit upload failed: {}", e.getMessage(), e);
            throw e;
        } catch (Exception e) {
            log.error("ImageKit upload failed", e);
            throw new IllegalStateException("ImageKit upload failed.", e);
        }
    }

    public String uploadBlogImage(MultipartFile image) {

        if (image == null || image.isEmpty()) {
            throw new IllegalArgumentException("Blog image is required.");
        }

        String contentType = image.getContentType();

        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Only image files are allowed.");
        }

        if (image.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException("Image size must be 5 MB or less.");
        }

        String originalName = Objects.requireNonNullElse(
                image.getOriginalFilename(), "blog.jpg");

        String fileName = System.currentTimeMillis() + "-" + originalName;

        try {
            FileUploadParams params = FileUploadParams.builder()
                    .file(image.getBytes())
                    .fileName(fileName)
                    .folder("/blogs")
                    .build();

            FileUploadResponse response = client().files().upload(params);

            return response.url()
                    .orElseThrow(() ->
                            new IllegalStateException("ImageKit did not return an image URL."));

        } catch (IOException e) {
            throw new IllegalStateException("Could not read the uploaded image.", e);
        } catch (IllegalStateException e) {
            log.error("ImageKit upload failed: {}", e.getMessage(), e);
            throw e;
        } catch (Exception e) {
            log.error("ImageKit upload failed", e);
            throw new IllegalStateException("ImageKit upload failed.", e);
        }
    }
}
