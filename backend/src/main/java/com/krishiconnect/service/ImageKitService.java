package com.krishiconnect.service;

import io.imagekit.client.ImageKitClient;
import io.imagekit.client.okhttp.ImageKitOkHttpClient;
import io.imagekit.models.files.FileUploadParams;
import io.imagekit.models.files.FileUploadResponse;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Objects;

@Service
public class ImageKitService {

    // Created on first use so the whole backend can still start (login,
    // recipes, AI ...) when the ImageKit keys are not configured yet.
    private volatile ImageKitClient imageKitClient;

    private ImageKitClient client() {
        ImageKitClient local = imageKitClient;
        if (local == null) {
            synchronized (this) {
                if (imageKitClient == null) {
                    try {
                        imageKitClient = ImageKitOkHttpClient.fromEnv();
                    } catch (Exception e) {
                        throw new IllegalStateException(
                                "Image uploads are not configured. Set the ImageKit "
                                        + "environment variables (IMAGEKIT_PRIVATE_KEY).", e);
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
        } catch (Exception e) {
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

    } catch (Exception e) {

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
        } catch (Exception e) {
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
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException("ImageKit upload failed.", e);
        }
    }
}
