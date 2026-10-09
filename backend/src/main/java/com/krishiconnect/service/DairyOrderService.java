package com.krishiconnect.service;

import com.krishiconnect.dto.DairyDtos.*;
import com.krishiconnect.entity.*;
import com.krishiconnect.repository.DairyOrderRepository;
import com.krishiconnect.repository.DairyProductRepository;
import com.krishiconnect.repository.DairySubscriptionRepository;
import com.krishiconnect.security.AuthContext;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Set;

/** Direct orders and monthly subscriptions. Payment is cash on delivery. */
@Service
public class DairyOrderService {

    private static final Set<String> ORDER_OWNER_STATUSES =
            Set.of("CONFIRMED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED");
    private static final Set<String> ORDER_FINAL = Set.of("DELIVERED", "CANCELLED");
    private static final Set<String> SUB_OWNER_STATUSES =
            Set.of("ACTIVE", "PAUSED", "CANCELLED");

    private final DairyOrderRepository orders;
    private final DairySubscriptionRepository subscriptions;
    private final DairyProductRepository products;
    private final DairyStoreService storeService;
    private final AuthContext authContext;

    public DairyOrderService(
            DairyOrderRepository orders,
            DairySubscriptionRepository subscriptions,
            DairyProductRepository products,
            DairyStoreService storeService,
            AuthContext authContext
    ) {
        this.orders = orders;
        this.subscriptions = subscriptions;
        this.products = products;
        this.storeService = storeService;
        this.authContext = authContext;
    }

    // ================= DIRECT ORDERS =================

    @Transactional
    public OrderView placeOrder(Authentication auth, OrderRequest req) {
        User consumer = storeService.requireUser(auth);
        DairyProduct product = sellableProduct(req.productId());
        DairyStore store = product.getStore();
        rejectOwnStore(store, consumer);

        BigDecimal qty = req.quantity().setScale(2, RoundingMode.HALF_UP);

        if (products.decrementStock(product.getId(), qty) == 0) {
            throw new IllegalArgumentException(
                    "Not enough stock. Please reduce the quantity.");
        }

        DairyOrder o = new DairyOrder();
        o.setStore(store);
        o.setProduct(product);
        o.setConsumer(consumer);
        o.setProductName(product.getName());
        o.setUnit(product.getUnit());
        o.setUnitPrice(product.getPrice());
        o.setQuantity(qty);
        o.setTotalAmount(product.getPrice().multiply(qty).setScale(2, RoundingMode.HALF_UP));
        o.setDeliveryAddress(req.deliveryAddress().trim());
        o.setPhone(req.phone().trim());
        o.setNote(req.note() == null || req.note().isBlank() ? null : req.note().trim());

        return toView(orders.save(o));
    }

    @Transactional(readOnly = true)
    public List<OrderView> myOrders(Authentication auth) {
        Long userId = authContext.userId(auth);
        return orders.findByConsumer_IdOrderByCreatedAtDesc(userId)
                .stream().map(DairyOrderService::toView).toList();
    }

    @Transactional(readOnly = true)
    public List<OrderView> storeOrders(Authentication auth) {
        DairyStore store = storeService.requireOwnStore(auth);
        return orders.findByStore_IdOrderByCreatedAtDesc(store.getId())
                .stream().map(DairyOrderService::toView).toList();
    }

    @Transactional
    public OrderView updateOrderStatus(Authentication auth, Long id, String rawStatus) {
        Long userId = authContext.userId(auth);
        String status = rawStatus.trim().toUpperCase();

        DairyOrder o = orders.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Order not found."));

        boolean isOwner = o.getStore().getOwner().getId().equals(userId);
        boolean isConsumer = o.getConsumer().getId().equals(userId);

        if (!isOwner && !isConsumer) {
            throw new AccessDeniedException("This is not your order.");
        }
        if (ORDER_FINAL.contains(o.getStatus())) {
            throw new IllegalArgumentException("This order is already " + o.getStatus().toLowerCase() + ".");
        }

        if (isOwner) {
            if (!ORDER_OWNER_STATUSES.contains(status)) {
                throw new IllegalArgumentException("Invalid status.");
            }
        } else {
            // Customers can only cancel, and only before the store confirms.
            if (!"CANCELLED".equals(status) || !"PLACED".equals(o.getStatus())) {
                throw new IllegalArgumentException(
                        "You can only cancel an order that the store hasn't confirmed yet.");
            }
        }

        o.setStatus(status);
        DairyOrder saved = orders.save(o);

        // Put the milk back on the shelf when an order is cancelled.
        if ("CANCELLED".equals(status)) {
            products.incrementStock(saved.getProduct().getId(), saved.getQuantity());
        }

        return toView(saved);
    }

    // ================= SUBSCRIPTIONS =================

    @Transactional
    public SubscriptionView subscribe(Authentication auth, SubscriptionRequest req) {
        User consumer = storeService.requireUser(auth);
        DairyProduct product = sellableProduct(req.productId());
        DairyStore store = product.getStore();
        rejectOwnStore(store, consumer);

        if (!product.isSubscriptionEnabled()
                || product.getMonthlySubscriptionPrice() == null
                || product.getSubscriptionQuantityPerDay() == null) {
            throw new IllegalArgumentException(
                    "This store does not offer a monthly subscription for this product.");
        }
        if (req.startDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Start date cannot be in the past.");
        }

        DairySubscription s = new DairySubscription();
        s.setStore(store);
        s.setProduct(product);
        s.setConsumer(consumer);
        s.setProductName(product.getName());
        s.setUnit(product.getUnit());
        s.setQuantityPerDay(product.getSubscriptionQuantityPerDay());
        s.setMonthlyPrice(product.getMonthlySubscriptionPrice());
        s.setDeliveryAddress(req.deliveryAddress().trim());
        s.setPhone(req.phone().trim());
        s.setStartDate(req.startDate());

        return toView(subscriptions.save(s));
    }

    @Transactional(readOnly = true)
    public List<SubscriptionView> mySubscriptions(Authentication auth) {
        Long userId = authContext.userId(auth);
        return subscriptions.findByConsumer_IdOrderByCreatedAtDesc(userId)
                .stream().map(DairyOrderService::toView).toList();
    }

    @Transactional(readOnly = true)
    public List<SubscriptionView> storeSubscriptions(Authentication auth) {
        DairyStore store = storeService.requireOwnStore(auth);
        return subscriptions.findByStore_IdOrderByCreatedAtDesc(store.getId())
                .stream().map(DairyOrderService::toView).toList();
    }

    @Transactional
    public SubscriptionView updateSubscriptionStatus(
            Authentication auth, Long id, String rawStatus
    ) {
        Long userId = authContext.userId(auth);
        String status = rawStatus.trim().toUpperCase();

        DairySubscription s = subscriptions.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Subscription not found."));

        boolean isOwner = s.getStore().getOwner().getId().equals(userId);
        boolean isConsumer = s.getConsumer().getId().equals(userId);

        if (!isOwner && !isConsumer) {
            throw new AccessDeniedException("This is not your subscription.");
        }
        if ("CANCELLED".equals(s.getStatus())) {
            throw new IllegalArgumentException("This subscription is already cancelled.");
        }

        if (isOwner) {
            if (!SUB_OWNER_STATUSES.contains(status)) {
                throw new IllegalArgumentException("Invalid status.");
            }
        } else if (!"CANCELLED".equals(status)) {
            throw new IllegalArgumentException("You can only cancel your subscription.");
        }

        s.setStatus(status);
        return toView(subscriptions.save(s));
    }

    // ================= HELPERS =================

    private DairyProduct sellableProduct(Long productId) {
        DairyProduct p = products.findById(productId)
                .orElseThrow(() -> new NoSuchElementException("Product not found."));
        if (!p.isAvailable() || !p.getStore().isActive()) {
            throw new IllegalArgumentException("This product is not available right now.");
        }
        return p;
    }

    private void rejectOwnStore(DairyStore store, User consumer) {
        if (store.getOwner() != null && store.getOwner().getId().equals(consumer.getId())) {
            throw new IllegalArgumentException("You can't buy from your own store.");
        }
    }

    static OrderView toView(DairyOrder o) {
        return new OrderView(
                o.getId(), o.getStore().getId(), o.getStore().getStoreName(),
                o.getProduct().getId(), o.getProductName(), o.getUnit(),
                o.getUnitPrice(), o.getQuantity(), o.getTotalAmount(),
                o.getDeliveryAddress(), o.getPhone(), o.getNote(),
                o.getPaymentMethod(), o.getStatus(), o.getConsumer().getName(),
                o.getCreatedAt());
    }

    static SubscriptionView toView(DairySubscription s) {
        return new SubscriptionView(
                s.getId(), s.getStore().getId(), s.getStore().getStoreName(),
                s.getProduct().getId(), s.getProductName(), s.getUnit(),
                s.getQuantityPerDay(), s.getMonthlyPrice(),
                s.getDeliveryAddress(), s.getPhone(), s.getStartDate(),
                s.getStatus(), s.getConsumer().getName(), s.getCreatedAt());
    }
}
