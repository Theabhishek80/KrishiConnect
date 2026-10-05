package com.krishiconnect.dto;

public record MandiRateDto(
        String state,
        String district,
        String market,
        String commodity,
        String variety,
        String grade,
        String arrivalDate,
        String minPrice,
        String maxPrice,
        String modalPrice
) {
}
