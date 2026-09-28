package com.krishiconnect.controller;

import com.krishiconnect.dto.ProductDtos.*;
import com.krishiconnect.entity.Product;
import com.krishiconnect.entity.ProductImage;
import com.krishiconnect.security.AuthContext;
import com.krishiconnect.service.ProductService;

import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService service;
    private final AuthContext context;

    public ProductController(ProductService s, AuthContext c) {
        service = s;
        context = c;
    }

    @GetMapping
    public Page<Product> list(
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        return service.publicProducts(q, page, size);
    }

    @PostMapping("/farmer")
    @PreAuthorize("hasRole('FARMER')")
    public Product create(
            Authentication a,
            @Valid @RequestBody CreateRequest r
    ) {
        return service.create(context.userId(a), r);
    }

    @PostMapping(
            value = "/farmer/{productId}/images",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    @PreAuthorize("hasRole('FARMER')")
    public ProductImage uploadImage(
            Authentication a,
            @PathVariable Long productId,
            @RequestParam("image") MultipartFile image
    ) {
        return service.addProductImage(
                context.userId(a),
                productId,
                image
        );
    }
}
