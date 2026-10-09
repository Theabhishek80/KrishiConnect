
package com.krishiconnect.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DairyStoreRequest(

        @NotBlank(message = "Store name is required")
        @Size(max = 180)
        String storeName,

        @Size(max = 5000)
        String description,

        @Size(max = 40)
        String phone,

        @NotBlank(message = "Address is required")
        @Size(max = 255)
        String addressLine,

        @NotBlank(message = "City is required")
        @Size(max = 100)
        String city,

        @NotBlank(message = "State is required")
        @Size(max = 100)
        String state,

        @NotBlank(message = "Postal code is required")
        @Size(max = 20)
        String postalCode,

        @DecimalMin("-90.0")
        @DecimalMax("90.0")
        Double latitude,

        @DecimalMin("-180.0")
        @DecimalMax("180.0")
        Double longitude,

        @DecimalMin("0.1")
        @DecimalMax("500.0")
        Double deliveryRadiusKm,

        @Size(max = 200)
        String operatingDays
) {}
