package com.krishiconnect.dto;
import jakarta.validation.constraints.*;
public final class CartDtos {
 public record ItemRequest(@NotNull Long productId,@Min(1) int quantity) {}
}
