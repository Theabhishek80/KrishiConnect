package com.krishiconnect.controller;

import com.krishiconnect.dto.ProductDtos.CreateRequest;
import com.krishiconnect.entity.Product;
import com.krishiconnect.entity.ProductImage;
import com.krishiconnect.security.AuthContext;
import com.krishiconnect.service.ProductService;

import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService service;
    private final AuthContext context;

    public ProductController(
            ProductService service,
            AuthContext context
    ) {
        this.service = service;
        this.context = context;
    }

    // ============================================================
    // PUBLIC MARKETPLACE
    // ============================================================

    @GetMapping
    public Page<Product> list(
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        return service.publicProducts(
                q,
                page,
                size
        );
    }

    // ============================================================
    // FARMER - CREATE PRODUCT
    // ============================================================

    @PostMapping("/farmer")
    @PreAuthorize("hasRole('FARMER')")
    public ResponseEntity<Map<String, Object>> create(
            Authentication authentication,
            @Valid @RequestBody CreateRequest request
    ) {

        Long farmerId =
                context.userId(authentication);

        Product product =
                service.create(
                        farmerId,
                        request
                );

        Map<String, Object> response =
                new LinkedHashMap<>();

        response.put(
                "id",
                product.getId()
        );

        response.put(
                "name",
                product.getName()
        );

        response.put(
                "status",
                product.getStatus()
        );

        response.put(
                "message",
                "Product submitted for admin approval."
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    // ============================================================
    // FARMER - UPLOAD PRODUCT IMAGE
    // ============================================================

    @PostMapping(
            value = "/farmer/{productId}/images",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    @PreAuthorize("hasRole('FARMER')")
    public ResponseEntity<Map<String, Object>> uploadImage(
            Authentication authentication,
            @PathVariable Long productId,
            @RequestParam("image") MultipartFile image
    ) {

        Long farmerId =
                context.userId(authentication);

        ProductImage savedImage =
                service.addProductImage(
                        farmerId,
                        productId,
                        image
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        Map.of(
                                "id",
                                savedImage.getId(),

                                "productId",
                                productId,

                                "url",
                                savedImage.getUrl(),

                                "message",
                                "Product image uploaded successfully."
                        )
                );
    }

    // ============================================================
    // FARMER - GET MY PRODUCTS
    // ============================================================

    @GetMapping("/farmer/my-products")
    @PreAuthorize("hasRole('FARMER')")
    public Page<Product> myProducts(
            Authentication authentication
    ) {

        Long farmerId =
                context.userId(authentication);

        return service.farmerProducts(
                farmerId
        );
    }

    // ============================================================
    // FARMER - DELETE PRODUCT
    // ============================================================

    @DeleteMapping("/farmer/{productId}")
    @PreAuthorize("hasRole('FARMER')")
    public ResponseEntity<Map<String, String>> deleteFarmerProduct(
            Authentication authentication,
            @PathVariable Long productId
    ) {

        Long farmerId =
                context.userId(authentication);

        String message =
                service.deleteProduct(
                        farmerId,
                        productId
                );

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        message
                )
        );
    }
}
