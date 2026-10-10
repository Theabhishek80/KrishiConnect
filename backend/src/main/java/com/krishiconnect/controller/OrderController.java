package com.krishiconnect.controller;

import com.krishiconnect.dto.OrderDtos.CheckoutRequest;
import com.krishiconnect.dto.OrderDtos.StatusRequest;
import com.krishiconnect.security.AuthContext;
import com.krishiconnect.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService service;
    private final AuthContext context;

    public OrderController(OrderService service, AuthContext context) {
        this.service = service;
        this.context = context;
    }

    @PostMapping("/checkout")
    @PreAuthorize("hasRole('CONSUMER')")
    public Object checkout(Authentication a, @Valid @RequestBody CheckoutRequest request) {
        return service.checkout(context.userId(a), request);
    }

    /** Orders the logged-in customer has placed. */
    @GetMapping("/mine")
    @PreAuthorize("hasRole('CONSUMER')")
    public Object mine(Authentication a) {
        return service.consumerOrders(context.userId(a));
    }

    /** Orders a farmer has received. */
    @GetMapping("/farmer")
    @PreAuthorize("hasRole('FARMER')")
    public Object farmerOrders(Authentication a) {
        return service.farmerOrders(context.userId(a));
    }

    /** One order - only its customer or its farmer can open it. */
    @GetMapping("/{orderId}")
    public Object one(Authentication a, @PathVariable Long orderId) {
        return service.getOrder(context.userId(a), orderId);
    }

    @PatchMapping("/{orderId}/cancel")
    @PreAuthorize("hasRole('CONSUMER')")
    public Object cancel(Authentication a, @PathVariable Long orderId) {
        return service.cancelByConsumer(context.userId(a), orderId);
    }

    @PatchMapping("/{orderId}/status")
    @PreAuthorize("hasRole('FARMER')")
    public Object updateStatus(Authentication a, @PathVariable Long orderId,
                               @Valid @RequestBody StatusRequest request) {
        return service.updateStatus(context.userId(a), orderId, request);
    }
}
