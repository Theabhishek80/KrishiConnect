package com.krishiconnect.controller;

import com.krishiconnect.repository.NotificationRepository;
import com.krishiconnect.security.AuthContext;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    private final NotificationRepository notifications;
    private final AuthContext context;

    public NotificationController(NotificationRepository notifications, AuthContext context) {
        this.notifications = notifications; this.context = context;
    }

    @GetMapping
    public Object list(Authentication authentication) {
        return notifications.findByUserIdOrderByCreatedAtDesc(context.userId(authentication));
    }
}
