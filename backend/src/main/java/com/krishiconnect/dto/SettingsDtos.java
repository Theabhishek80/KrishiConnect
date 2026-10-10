package com.krishiconnect.dto;

public final class SettingsDtos {

    private SettingsDtos() {
    }

    public record SettingsRequest(Boolean notifyOrders, Boolean notifyEmail) {
    }

    public record SettingsView(
            String name,
            String email,
            String role,
            boolean notifyOrders,
            boolean notifyEmail
    ) {
    }
}
