package com.krishiconnect.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

public final class CartDtos {

    private CartDtos() {
    }

    public record ItemRequest(
            @NotNull Long productId,
            @Min(1) int quantity
    ) {
    }

    public record CartResponse(
            Long id,
            List<CartItemResponse> items,
            BigDecimal total
    ) {
    }

    public record CartItemResponse(
            Long id,
            ProductResponse product,
            int quantity,
            BigDecimal subtotal
    ) {
    }

    public record ProductResponse(
            Long id,
            String name,
            String description,
            BigDecimal price,
            String unit,
            List<String> images
    ) {
    }
}
