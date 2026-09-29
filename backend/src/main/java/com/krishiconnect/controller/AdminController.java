package com.krishiconnect.controller;

import com.krishiconnect.domain.ProductStatus;
import com.krishiconnect.repository.OrderRepository;
import com.krishiconnect.repository.ProductRepository;
import com.krishiconnect.repository.UserRepository;
import com.krishiconnect.security.AuthContext;

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

    public AdminController(
            UserRepository users,
            ProductRepository products,
            OrderRepository orders,
            AuthContext context
    ) {
        this.users = users;
        this.products = products;
        this.orders = orders;
        this.context = context;
    }

    @GetMapping("/dashboard")
    public Map<String, Object> dashboard() {
        return Map.of(
                "users", users.count(),
                "products", products.count(),
                "pendingProducts",
                products.findByStatus(
                        ProductStatus.PENDING_APPROVAL,
                        org.springframework.data.domain.PageRequest.of(0, 1)
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
                org.springframework.data.domain.PageRequest.of(0, 100)
        );
    }

    @PatchMapping("/products/{id}/approve")
    public Object approve(@PathVariable Long id) {
        var product = products.findById(id).orElseThrow();
        product.setStatus(ProductStatus.APPROVED);
        return products.save(product);
    }

    @PatchMapping("/products/{id}/reject")
    public Object reject(@PathVariable Long id) {
        var product = products.findById(id).orElseThrow();
        product.setStatus(ProductStatus.REJECTED);
        return products.save(product);
    }

    @DeleteMapping("/products/{id}")
    public void deleteProduct(@PathVariable Long id) {
        products.deleteById(id);
    }
}


