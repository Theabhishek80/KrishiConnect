package com.krishiconnect.controller;

import com.krishiconnect.domain.ProductStatus;
import com.krishiconnect.repository.OrderRepository;
import com.krishiconnect.repository.ProductRepository;
import com.krishiconnect.repository.UserRepository;
import com.krishiconnect.security.AuthContext;
import com.krishiconnect.service.ProductService;

import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepository users;
    private final ProductRepository products;
    private final OrderRepository orders;
    private final AuthContext context;
    private final ProductService productService;

    public AdminController(
            UserRepository users,
            ProductRepository products,
            OrderRepository orders,
            AuthContext context,
            ProductService productService
    ) {
        this.users = users;
        this.products = products;
        this.orders = orders;
        this.context = context;
        this.productService = productService;
    }

    @GetMapping("/dashboard")
    public Map<String, Object> dashboard() {
        return Map.of(
                "users", users.count(),
                "products", products.count(),
                "pendingProducts",
                products.findByStatus(
                        ProductStatus.PENDING_APPROVAL,
                        PageRequest.of(0, 1)
                ).getTotalElements(),
                "orders", orders.count()
        );
    }

    @GetMapping("/products")
    public Object allProducts() {
        return products.findAllWithDetails();
    }

    @GetMapping("/products/pending")
    public Object pendingProducts() {
        return products.findByStatus(
                ProductStatus.PENDING_APPROVAL,
                PageRequest.of(0, 100)
        );
    }

    @PatchMapping("/products/{id}/approve")
    public Object approve(@PathVariable Long id) {

        var product = products.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Product not found."
                        )
                );

        product.setStatus(ProductStatus.APPROVED);

        return products.save(product);
    }

    @PatchMapping("/products/{id}/reject")
    public Object reject(@PathVariable Long id) {

        var product = products.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Product not found."
                        )
                );

        product.setStatus(ProductStatus.REJECTED);

        return products.save(product);
    }

    /*
     * SAFE ADMIN PRODUCT DELETE
     *
     * Do NOT use products.deleteById(id) here.
     *
     * ProductService checks:
     * - cart references
     * - existing order history
     * - whether the product should be deleted
     * - whether it should instead be archived
     */
    @DeleteMapping("/products/{id}")
    public Map<String, String> deleteProduct(
            @PathVariable Long id
    ) {

        String message =
                productService.deleteProductAsAdmin(id);

        return Map.of(
                "message",
                message
        );
    }
}

