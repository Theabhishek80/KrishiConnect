package com.krishiconnect.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public final class OrderDtos {

    private OrderDtos() {
    }

    /** addressId = one of the user's saved addresses. paymentMethod: only "COD" for now. */
    public record CheckoutRequest(
            @NotNull Long addressId,
            String paymentMethod
    ) {
    }

    /** expectedDeliveryDate is optional (yyyy-MM-dd) - farmers may set it. */
    public record StatusRequest(
            @NotBlank String status,
            String expectedDeliveryDate
    ) {
    }

    public record PartyView(Long id, String name) {
    }

    public record OrderItemView(
            Long id,
            Long productId,
            String productName,
            String image,
            String unit,
            BigDecimal unitPrice,
            int quantity,
            BigDecimal lineTotal
    ) {
    }

    public record OrderView(
            Long id,
            String orderNumber,
            String status,
            String paymentMethod,
            String paymentStatus,
            BigDecimal totalAmount,
            LocalDate expectedDeliveryDate,
            Instant createdAt,
            Instant updatedAt,
            Instant deliveredAt,
            Instant cancelledAt,
            String shippingName,
            String shippingPhone,
            String shippingAddress,
            PartyView consumer,
            PartyView farmer,
            List<OrderItemView> items,
            boolean cancellable,
            List<String> nextStatuses
    ) {
    }
}
