package com.krishiconnect.controller;

import com.krishiconnect.security.AuthContext;
import com.krishiconnect.service.NotificationService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService service;
    private final AuthContext context;

    public NotificationController(NotificationService service, AuthContext context) {
        this.service = service;
        this.context = context;
    }

    /** Latest 50 notifications, newest first. */
    @GetMapping
    public Object list(Authentication authentication) {
        return service.list(context.userId(authentication));
    }

    /** Small, cheap call used by the navbar bell for the red badge. */
    @GetMapping("/unread-count")
    public Map<String, Long> unreadCount(Authentication authentication) {
        return Map.of("count", service.unreadCount(context.userId(authentication)));
    }

    @PatchMapping("/read-all")
    public Map<String, Integer> readAll(Authentication authentication) {
        return Map.of("updated", service.markAllRead(context.userId(authentication)));
    }

    @PatchMapping("/{id}/read")
    public Object read(Authentication authentication, @PathVariable Long id) {
        return service.markRead(context.userId(authentication), id);
    }
}

