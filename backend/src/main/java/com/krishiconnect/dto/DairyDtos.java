package com.krishiconnect.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public final class DairyDtos {

    private DairyDtos() {}

    // ---------------------------------------------------------------
    // STORE (response). Replaces returning the raw entity so we can add
    // rating, review count, days listed and distance.
    // ---------------------------------------------------------------
    public record StoreView(
            Long id,
            String storeName,
            String description,
            String phone,
            String addressLine,
            String city,
            String state,
            String postalCode,
            Double latitude,
            Double longitude,
            Double deliveryRadiusKm,
            String operatingDays,
            boolean active,
            Instant createdAt,
            long daysListed,
            double averageRating,
            long reviewCount,
            long productCount,
            Double distanceKm,
            String ownerName
    ) {}

    // ---------------------------------------------------------------
    // PRODUCTS
    // ---------------------------------------------------------------
    public record ProductRequest(
            @NotBlank(message = "Product name is required")
            @Size(max = 180)
            String name,

            @Size(max = 2000)
            String description,

            @NotBlank(message = "Category is required")
            @Size(max = 30)
            String category,

            @NotNull(message = "Price is required")
            @DecimalMin(value = "0.0", message = "Price cannot be negative")
            @DecimalMax(value = "1000000.0")
            BigDecimal price,

            @NotBlank(message = "Unit is required")
            @Size(max = 40)
            String unit,

            @NotNull(message = "Stock quantity is required")
            @DecimalMin(value = "0.0", message = "Stock cannot be negative")
            @DecimalMax(value = "1000000.0")
            BigDecimal stockQuantity,

            Boolean available,

            Boolean subscriptionEnabled,

            @DecimalMin(value = "0.1")
            @DecimalMax(value = "1000.0")
            BigDecimal subscriptionQuantityPerDay,

            @DecimalMin(value = "0.0")
            @DecimalMax(value = "10000000.0")
            BigDecimal monthlySubscriptionPrice
    ) {}

    public record ProductView(
            Long id,
            Long storeId,
            String name,
            String description,
            String category,
            BigDecimal price,
            String unit,
            BigDecimal stockQuantity,
            boolean available,
            boolean subscriptionEnabled,
            BigDecimal subscriptionQuantityPerDay,
            BigDecimal monthlySubscriptionPrice,
            Instant createdAt
    ) {}

    // ---------------------------------------------------------------
    // REVIEWS (of the whole store, not of products)
    // ---------------------------------------------------------------
    public record ReviewRequest(
            @NotNull(message = "Rating is required")
            @Min(value = 1, message = "Rating must be 1 to 5")
            @Max(value = 5, message = "Rating must be 1 to 5")
            Integer rating,

            @Size(max = 1000)
            String comment
    ) {}

    public record ReviewView(
            Long id,
            Long userId,
            String userName,
            int rating,
            String comment,
            Instant createdAt
    ) {}

    public record ReviewsResponse(
            double averageRating,
            long reviewCount,
            java.util.List<ReviewView> reviews
    ) {}

    // ---------------------------------------------------------------
    // ORDERS
    // ---------------------------------------------------------------
    public record OrderRequest(
            @NotNull(message = "Product is required")
            Long productId,

            @NotNull(message = "Quantity is required")
            @DecimalMin(value = "0.1", message = "Quantity must be at least 0.1")
            @DecimalMax(value = "1000.0")
            BigDecimal quantity,

            @NotBlank(message = "Delivery address is required")
            @Size(max = 500)
            String deliveryAddress,

            @NotBlank(message = "Phone number is required")
            @Size(max = 40)
            String phone,

            @Size(max = 500)
            String note
    ) {}

    public record OrderView(
            Long id,
            Long storeId,
            String storeName,
            Long productId,
            String productName,
            String unit,
            BigDecimal unitPrice,
            BigDecimal quantity,
            BigDecimal totalAmount,
            String deliveryAddress,
            String phone,
            String note,
            String paymentMethod,
            String status,
            String consumerName,
            Instant createdAt
    ) {}

    // ---------------------------------------------------------------
    // SUBSCRIPTIONS (monthly)
    // ---------------------------------------------------------------
    public record SubscriptionRequest(
            @NotNull(message = "Product is required")
            Long productId,

            @NotBlank(message = "Delivery address is required")
            @Size(max = 500)
            String deliveryAddress,

            @NotBlank(message = "Phone number is required")
            @Size(max = 40)
            String phone,

            @NotNull(message = "Start date is required")
            LocalDate startDate
    ) {}

    public record SubscriptionView(
            Long id,
            Long storeId,
            String storeName,
            Long productId,
            String productName,
            String unit,
            BigDecimal quantityPerDay,
            BigDecimal monthlyPrice,
            String deliveryAddress,
            String phone,
            LocalDate startDate,
            String status,
            String consumerName,
            Instant createdAt
    ) {}

    public record StatusRequest(
            @NotBlank(message = "Status is required")
            String status
    ) {}
}
