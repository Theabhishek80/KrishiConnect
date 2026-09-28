package com.krishiconnect.dto;
import jakarta.validation.constraints.*;
public final class OrderDtos {
 public record CheckoutRequest(@NotBlank String shippingAddress) {}
 public record StatusRequest(@NotBlank String status) {}
}
