package com.krishiconnect.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class AddressDtos {

    private AddressDtos() {
    }

    public record AddressRequest(
            @NotBlank @Size(max = 50) String label,
            @NotBlank @Size(max = 120) String recipientName,
            @NotBlank @Pattern(regexp = "^[+0-9 ()-]{7,20}$", message = "Enter a valid phone number") String phone,
            @NotBlank @Size(max = 255) String line1,
            @Size(max = 255) String line2,
            @NotBlank @Size(max = 100) String city,
            @NotBlank @Size(max = 100) String state,
            @NotBlank @Pattern(regexp = "^[0-9]{6}$", message = "Enter a valid 6-digit PIN code") String postalCode,
            Boolean makeDefault
    ) {
    }

    public record AddressView(
            Long id,
            String label,
            String recipientName,
            String phone,
            String line1,
            String line2,
            String city,
            String state,
            String postalCode,
            String country,
            boolean defaultAddress
    ) {
    }
}
