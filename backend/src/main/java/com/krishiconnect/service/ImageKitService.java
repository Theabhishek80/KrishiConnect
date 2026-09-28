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

    private final ImageKitClient imageKitClient;

    public ImageKitService() {
        this.imageKitClient = ImageKitOkHttpClient.fromEnv();
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

            FileUploadResponse response = imageKitClient.files().upload(params);
            return response.url()
        .orElseThrow(() -> new IllegalStateException("ImageKit did not return an image URL."));

        } catch (IOException e) {
            throw new IllegalStateException("Could not read the uploaded image.", e);
        } catch (Exception e) {
            throw new IllegalStateException("ImageKit upload failed.", e);
        }
    }
}
