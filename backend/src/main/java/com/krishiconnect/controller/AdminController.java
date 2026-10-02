package com.krishiconnect.controller;

import com.krishiconnect.service.AdminService;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/dashboard")
    public Map<String, Object> dashboard() {
        return adminService.dashboard();
    }

    @GetMapping("/products")
    public Object allProducts() {
        return adminService.getAllProducts();
    }

    @GetMapping("/products/pending")
    public Object pendingProducts() {
        return adminService.getPendingProducts();
    }

    @PatchMapping("/products/{id}/approve")
    public Object approve(@PathVariable Long id) {
        return adminService.approveProduct(id);
    }

    @PatchMapping("/products/{id}/reject")
    public Object reject(@PathVariable Long id) {
        return adminService.rejectProduct(id);
    }

    @DeleteMapping("/products/{id}")
    public void deleteProduct(@PathVariable Long id) {
        adminService.deleteProduct(id);
    }
}
@GetMapping("/users")
public Object allUsers() {
    return adminService.getAllUsers();
}


