package com.krishiconnect.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public final class ProductDtos {

    private ProductDtos() {
        // Utility class
    }

    public record CreateRequest(

            @NotBlank(message = "Product name is required")
            String name,

            @NotBlank(message = "Product description is required")
            String description,

            @NotNull(message = "Product price is required")
            @PositiveOrZero(message = "Product price cannot be negative")
            BigDecimal price,

            @NotBlank(message = "Product unit is required")
            String unit,

            @NotNull(message = "Category is required")
            Long categoryId,

            @Min(value = 0, message = "Quantity cannot be negative")
            int quantity

    ) {
    }

    public record UpdateRequest(

            @NotBlank(message = "Product name is required")
            String name,

            @NotBlank(message = "Product description is required")
            String description,

            @NotNull(message = "Product price is required")
            @PositiveOrZero(message = "Product price cannot be negative")
            BigDecimal price,

            @NotBlank(message = "Product unit is required")
            String unit,

            @NotNull(message = "Category is required")
            Long categoryId

    ) {
    }
}
