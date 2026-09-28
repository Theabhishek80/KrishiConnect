package com.krishiconnect.controller;

import com.krishiconnect.service.CartService;
import com.krishiconnect.dto.CartDtos.ItemRequest;
import com.krishiconnect.security.AuthContext;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;

@RestController
@RequestMapping("/api/cart")
public class CartController {
    private final CartService service;
    private final AuthContext context;

    public CartController(CartService service, AuthContext context) {
        this.service = service;
        this.context = context;
    }

    @GetMapping
    public Object get(Authentication authentication) {
        return service.get(context.userId(authentication));
    }

    @PostMapping("/items")
    public Object add(Authentication authentication, @Valid @RequestBody ItemRequest request) {
        return service.add(context.userId(authentication), request);
    }

    @DeleteMapping("/items/{productId}")
    public void remove(Authentication authentication, @PathVariable Long productId) {
        service.remove(context.userId(authentication), productId);
    }
}
