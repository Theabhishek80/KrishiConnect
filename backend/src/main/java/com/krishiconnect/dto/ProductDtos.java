package com.krishiconnect.dto;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
public final class ProductDtos {
 public record CreateRequest(@NotBlank String name,@NotBlank String description,@NotNull @PositiveOrZero BigDecimal price,@NotBlank String unit,@NotNull Long categoryId,@Min(0) int quantity) {}
 public record UpdateRequest(@NotBlank String name,@NotBlank String description,@NotNull @PositiveOrZero BigDecimal price,@NotBlank String unit,@NotNull Long categoryId) {}
}
