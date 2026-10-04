package com.krishiconnect.service;

import com.krishiconnect.entity.Notification;
import com.krishiconnect.entity.User;
import com.krishiconnect.repository.NotificationRepository;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {
    private final NotificationRepository repository;
    public NotificationService(NotificationRepository repository) { this.repository = repository; }

    public Notification create(User user, String title, String message, String type) {
        Notification n = new Notification();
        n.setUser(user); n.setTitle(title); n.setMessage(message); n.setType(type);
        return repository.save(n);
    }
}
