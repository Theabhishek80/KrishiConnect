package com.krishiconnect.controller;

import com.krishiconnect.domain.OrderStatus;
import com.krishiconnect.domain.Role;
import com.krishiconnect.dto.SettingsDtos.SettingsRequest;
import com.krishiconnect.dto.SettingsDtos.SettingsView;
import com.krishiconnect.entity.User;
import com.krishiconnect.repository.OrderRepository;
import com.krishiconnect.repository.UserRepository;
import com.krishiconnect.security.AuthContext;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/settings")
public class SettingsController {

    private static final List<OrderStatus> FINISHED =
            List.of(OrderStatus.DELIVERED, OrderStatus.CANCELLED);

    private final UserRepository users;
    private final OrderRepository orders;
    private final AuthContext context;

    public SettingsController(UserRepository users, OrderRepository orders, AuthContext context) {
        this.users = users;
        this.orders = orders;
        this.context = context;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public SettingsView get(Authentication authentication) {
        return view(load(authentication));
    }

    @PutMapping
    @Transactional
    public SettingsView update(Authentication authentication, @RequestBody SettingsRequest request) {
        User user = load(authentication);

        if (request.notifyOrders() != null) {
            user.setNotifyOrders(request.notifyOrders());
        }

        if (request.notifyEmail() != null) {
            user.setNotifyEmail(request.notifyEmail());
        }

        user.setUpdatedAt(Instant.now());

        return view(users.save(user));
    }

    /**
     * Deactivates the account (it is not erased, so old orders stay intact for the
     * other party). Blocked while there are unfinished orders.
     */
    @DeleteMapping("/account")
    @Transactional
    public Map<String, Boolean> deactivate(Authentication authentication) {
        User user = load(authentication);

        if (user.getRole() == Role.ADMIN) {
            throw new AccessDeniedException("Forbidden");
        }

        boolean active = orders.existsByConsumerIdAndStatusNotIn(user.getId(), FINISHED)
                || orders.existsByFarmerIdAndStatusNotIn(user.getId(), FINISHED);

        if (active) {
            throw new IllegalArgumentException(
                    "You still have orders in progress. Please wait until they are delivered or cancelled.");
        }

        user.setEnabled(false);
        user.setUpdatedAt(Instant.now());
        users.save(user);

        return Map.of("deactivated", true);
    }

    private User load(Authentication authentication) {
        return users.findById(context.userId(authentication))
                .orElseThrow(() -> new IllegalStateException("User profile not found."));
    }

    private static SettingsView view(User user) {
        return new SettingsView(
                user.getName(),
                user.getEmail(),
                user.getRole().name(),
                user.isNotifyOrders(),
                user.isNotifyEmail()
        );
    }
}
