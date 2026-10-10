package com.krishiconnect.dto;

import java.time.Instant;

public final class NotificationDtos {

    private NotificationDtos() {
    }

    public record NotificationView(
            Long id,
            String title,
            String message,
            String type,
            String link,
            boolean read,
            Instant createdAt
    ) {
    }
}
