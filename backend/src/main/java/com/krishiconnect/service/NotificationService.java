package com.krishiconnect.service;

import com.krishiconnect.dto.NotificationDtos.NotificationView;
import com.krishiconnect.entity.Notification;
import com.krishiconnect.entity.User;
import com.krishiconnect.repository.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.concurrent.CompletableFuture;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository repository;
    private final EmailService emailService;

    public NotificationService(NotificationRepository repository, EmailService emailService) {
        this.repository = repository;
        this.emailService = emailService;
    }

    /** Plain notification (always stored). */
    public Notification create(User user, String title, String message, String type) {
        return create(user, title, message, type, null);
    }

    public Notification create(User user, String title, String message, String type, String link) {
        Notification n = new Notification();
        n.setUser(user);
        n.setTitle(title);
        n.setMessage(message);
        n.setType(type);
        n.setLink(link);
        return repository.save(n);
    }

    /**
     * Order related notification. Respects the user's Settings:
     *  - notifyOrders -> shows up in the bell
     *  - notifyEmail  -> also sent by e-mail (in the background, never breaks the request)
     */
    public void orderEvent(User user, String title, String message, Long orderId) {
        String link = "/orders/" + orderId;

        if (user.isNotifyOrders()) {
            create(user, title, message, "ORDER", link);
        }

        String email = user.getEmail();

        if (user.isNotifyEmail() && email != null && !email.isBlank()) {
            CompletableFuture.runAsync(() -> {
                try {
                    emailService.sendNotification(email, title, message, link);
                } catch (Exception e) {
                    log.warn("Could not send notification e-mail: {}", e.getMessage());
                }
            });
        }
    }

    @Transactional(readOnly = true)
    public List<NotificationView> list(Long userId) {
        return repository.findTop50ByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(NotificationService::toView)
                .toList();
    }

    @Transactional(readOnly = true)
    public long unreadCount(Long userId) {
        return repository.countByUserIdAndReadAtIsNull(userId);
    }

    @Transactional
    public NotificationView markRead(Long userId, Long id) {
        Notification n = repository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new NoSuchElementException("Notification not found"));

        if (n.getReadAt() == null) {
            n.setReadAt(Instant.now());
            repository.save(n);
        }

        return toView(n);
    }

    @Transactional
    public int markAllRead(Long userId) {
        return repository.markAllRead(userId, Instant.now());
    }

    private static NotificationView toView(Notification n) {
        return new NotificationView(
                n.getId(),
                n.getTitle(),
                n.getMessage(),
                n.getType(),
                n.getLink(),
                n.getReadAt() != null,
                n.getCreatedAt()
        );
    }
}
