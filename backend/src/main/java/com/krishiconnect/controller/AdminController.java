package com.krishiconnect.controller;

import com.krishiconnect.domain.ProductStatus;
import com.krishiconnect.repository.OrderRepository;
import com.krishiconnect.repository.ProductRepository;
import com.krishiconnect.repository.UserRepository;
import com.krishiconnect.security.AuthContext;
import com.krishiconnect.service.ProductService;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
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

    // ============================================================
    // ADMIN DASHBOARD
    // ============================================================

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> dashboard() {

        long pendingProducts =
                products.findByStatus(
                        ProductStatus.PENDING_APPROVAL,
                        PageRequest.of(0, 1)
                ).getTotalElements();

        return ResponseEntity.ok(
                Map.of(
                        "users", users.count(),
                        "products", products.count(),
                        "pendingProducts", pendingProducts,
                        "orders", orders.count()
                )
        );
    }

    // ============================================================
    // ALL PRODUCTS
    // ============================================================

    @GetMapping("/products")
    public ResponseEntity<?> allProducts() {

        return ResponseEntity.ok(
                products.findAllWithDetails()
        );
    }

    // ============================================================
    // PENDING PRODUCTS
    // ============================================================

    @GetMapping("/products/pending")
    public ResponseEntity<?> pendingProducts() {

        return ResponseEntity.ok(
                products.findByStatus(
                        ProductStatus.PENDING_APPROVAL,
                        PageRequest.of(
                                0,
                                100
                        )
                )
        );
    }

    // ============================================================
    // APPROVE PRODUCT
    // ============================================================

    @PatchMapping("/products/{id}/approve")
    public ResponseEntity<?> approve(
            @PathVariable Long id
    ) {

        var product = products.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Product not found."
                        )
                );

        /*
         * Only pending products should be approved.
         *
         * This prevents accidentally approving an already
         * rejected/deleted/inactive product.
         */
        if (product.getStatus() !=
                ProductStatus.PENDING_APPROVAL) {

            return ResponseEntity.badRequest().body(
                    Map.of(
                            "message",
                            "Only pending products can be approved.",
                            "status",
                            product.getStatus().name()
                    )
            );
        }

        product.setStatus(
                ProductStatus.APPROVED
        );

        var savedProduct =
                products.save(product);

        return ResponseEntity.ok(
                savedProduct
        );
    }

    // ============================================================
    // REJECT PRODUCT
    // ============================================================

    @PatchMapping("/products/{id}/reject")
    public ResponseEntity<?> reject(
            @PathVariable Long id
    ) {

        var product = products.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Product not found."
                        )
                );

        /*
         * Only pending products should be rejected.
         */
        if (product.getStatus() !=
                ProductStatus.PENDING_APPROVAL) {

            return ResponseEntity.badRequest().body(
                    Map.of(
                            "message",
                            "Only pending products can be rejected.",
                            "status",
                            product.getStatus().name()
                    )
            );
        }

        product.setStatus(
                ProductStatus.REJECTED
        );

        var savedProduct =
                products.save(product);

        return ResponseEntity.ok(
                savedProduct
        );
    }

    // ============================================================
    // ADMIN DELETE PRODUCT
    // ============================================================

    @DeleteMapping("/products/{id}")
    public ResponseEntity<Map<String, String>> deleteProduct(
            @PathVariable Long id
    ) {

        String message =
                productService.deleteProductAsAdmin(
                        id
                );

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        message
                )
        );
    }
}
