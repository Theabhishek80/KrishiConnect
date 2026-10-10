package com.krishiconnect.service;

import com.krishiconnect.domain.OrderStatus;
import com.krishiconnect.domain.PaymentStatus;
import com.krishiconnect.domain.ProductStatus;
import com.krishiconnect.dto.OrderDtos.CheckoutRequest;
import com.krishiconnect.dto.OrderDtos.OrderItemView;
import com.krishiconnect.dto.OrderDtos.OrderView;
import com.krishiconnect.dto.OrderDtos.PartyView;
import com.krishiconnect.dto.OrderDtos.StatusRequest;
import com.krishiconnect.entity.Address;
import com.krishiconnect.entity.Cart;
import com.krishiconnect.entity.CartItem;
import com.krishiconnect.entity.Order;
import com.krishiconnect.entity.OrderItem;
import com.krishiconnect.entity.Product;
import com.krishiconnect.entity.User;
import com.krishiconnect.repository.AddressRepository;
import com.krishiconnect.repository.CartItemRepository;
import com.krishiconnect.repository.CartRepository;
import com.krishiconnect.repository.InventoryRepository;
import com.krishiconnect.repository.OrderItemRepository;
import com.krishiconnect.repository.OrderRepository;
import com.krishiconnect.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
public class OrderService {

    /** Default promise shown to the customer: delivery within this many days. */
    private static final int DELIVERY_DAYS = 3;

    private static final ZoneId INDIA = ZoneId.of("Asia/Kolkata");

    private static final DateTimeFormatter DATE_FORMAT =
            DateTimeFormatter.ofPattern("d MMM yyyy", Locale.ENGLISH);

    private final OrderRepository orders;
    private final OrderItemRepository orderItems;
    private final CartRepository carts;
    private final CartItemRepository items;
    private final InventoryRepository inventory;
    private final UserRepository users;
    private final AddressRepository addresses;
    private final NotificationService notifications;

    public OrderService(
            OrderRepository orders,
            OrderItemRepository orderItems,
            CartRepository carts,
            CartItemRepository items,
            InventoryRepository inventory,
            UserRepository users,
            AddressRepository addresses,
            NotificationService notifications
    ) {
        this.orders = orders;
        this.orderItems = orderItems;
        this.carts = carts;
        this.items = items;
        this.inventory = inventory;
        this.users = users;
        this.addresses = addresses;
        this.notifications = notifications;
    }

    // ==================================================================
    // CHECKOUT
    // ==================================================================

    @Transactional
    public List<OrderView> checkout(Long userId, CheckoutRequest request) {
        String method = request.paymentMethod() == null || request.paymentMethod().isBlank()
                ? "COD"
                : request.paymentMethod().trim().toUpperCase(Locale.ROOT);

        if (!method.equals("COD")) {
            throw new IllegalArgumentException("Only Cash on Delivery is available right now.");
        }

        User consumer = users.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Address address = addresses.findByIdAndUserId(request.addressId(), userId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Please choose a valid delivery address."));

        Cart cart = carts.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Your cart is empty."));

        List<CartItem> cartItems = items.findByCartId(cart.getId());

        if (cartItems.isEmpty()) {
            throw new IllegalArgumentException("Your cart is empty.");
        }

        // One order per farmer.
        Map<Long, List<CartItem>> byFarmer = new LinkedHashMap<>();

        for (CartItem ci : cartItems) {
            Product product = ci.getProduct();

            if (product.getStatus() != ProductStatus.APPROVED) {
                throw new IllegalArgumentException(
                        product.getName() + " is no longer available. Please remove it from your cart.");
            }

            byFarmer
                    .computeIfAbsent(product.getFarmer().getId(), k -> new ArrayList<>())
                    .add(ci);
        }

        String addressText = formatAddress(address);
        LocalDate expected = LocalDate.now(INDIA).plusDays(DELIVERY_DAYS);

        List<Order> created = new ArrayList<>();

        for (List<CartItem> group : byFarmer.values()) {
            Order order = new Order();
            order.setConsumer(consumer);
            order.setFarmer(group.get(0).getProduct().getFarmer());
            order.setStatus(OrderStatus.PLACED);
            order.setPaymentMethod(method);
            order.setPaymentStatus(PaymentStatus.PENDING);
            order.setShippingName(address.getRecipientName());
            order.setShippingPhone(address.getPhone());
            order.setShippingAddress(addressText);
            order.setExpectedDeliveryDate(expected);

            BigDecimal total = BigDecimal.ZERO;
            List<OrderItem> lines = new ArrayList<>();

            for (CartItem ci : group) {
                Product product = ci.getProduct();

                var stock = inventory.findByProductId(product.getId())
                        .orElseThrow(() -> new IllegalArgumentException(
                                product.getName() + " is out of stock."));

                if (stock.getQuantity() < ci.getQuantity()) {
                    throw new IllegalArgumentException(
                            "Only " + stock.getQuantity() + " left in stock for " + product.getName() + ".");
                }

                stock.setQuantity(stock.getQuantity() - ci.getQuantity());
                inventory.save(stock);

                BigDecimal lineTotal = product.getPrice()
                        .multiply(BigDecimal.valueOf(ci.getQuantity()));

                total = total.add(lineTotal);

                OrderItem line = new OrderItem();
                line.setProduct(product);
                line.setProductName(product.getName());
                line.setUnitPrice(product.getPrice());
                line.setQuantity(ci.getQuantity());
                line.setLineTotal(lineTotal);
                lines.add(line);
            }

            order.setTotalAmount(total);
            Order saved = orders.save(order);

            for (OrderItem line : lines) {
                line.setOrder(saved);
            }

            orderItems.saveAll(lines);
            created.add(saved);

            notifications.orderEvent(
                    consumer,
                    "Order placed",
                    "Your order " + number(saved) + " for ₹" + total.toPlainString()
                            + " has been placed. Expected delivery by " + DATE_FORMAT.format(expected) + ".",
                    saved.getId()
            );

            notifications.orderEvent(
                    saved.getFarmer(),
                    "New order received",
                    "You received order " + number(saved) + " from " + consumer.getName()
                            + " (₹" + total.toPlainString() + "). Please confirm it.",
                    saved.getId()
            );
        }

        items.deleteAll(cartItems);

        return toViews(created);
    }

    // ==================================================================
    // READ
    // ==================================================================

    @Transactional(readOnly = true)
    public List<OrderView> consumerOrders(Long userId) {
        return toViews(orders.findByConsumerIdOrderByCreatedAtDesc(userId));
    }

    @Transactional(readOnly = true)
    public List<OrderView> farmerOrders(Long userId) {
        return toViews(orders.findByFarmerIdOrderByCreatedAtDesc(userId));
    }

    /** Visible to the customer who placed it and the farmer who must fulfil it. */
    @Transactional(readOnly = true)
    public OrderView getOrder(Long userId, Long orderId) {
        Order order = orders.findById(orderId)
                .orElseThrow(() -> new NoSuchElementException("Order not found"));

        boolean allowed = order.getConsumer().getId().equals(userId)
                || order.getFarmer().getId().equals(userId);

        if (!allowed) {
            throw new AccessDeniedException("Forbidden");
        }

        return toViews(List.of(order)).get(0);
    }

    // ==================================================================
    // CUSTOMER CANCEL
    // ==================================================================

    @Transactional
    public OrderView cancelByConsumer(Long userId, Long orderId) {
        Order order = orders.findById(orderId)
                .orElseThrow(() -> new NoSuchElementException("Order not found"));

        if (!order.getConsumer().getId().equals(userId)) {
            throw new AccessDeniedException("Forbidden");
        }

        if (!isConsumerCancellable(order.getStatus())) {
            throw new IllegalArgumentException(
                    "This order can no longer be cancelled because it is already being prepared.");
        }

        cancel(order);

        notifications.orderEvent(
                order.getFarmer(),
                "Order cancelled",
                "Order " + number(order) + " was cancelled by the customer.",
                order.getId()
        );

        notifications.orderEvent(
                order.getConsumer(),
                "Order cancelled",
                "You cancelled order " + number(order) + ".",
                order.getId()
        );

        return toViews(List.of(order)).get(0);
    }

    // ==================================================================
    // FARMER STATUS UPDATE
    // ==================================================================

    @Transactional
    public OrderView updateStatus(Long farmerId, Long orderId, StatusRequest request) {
        Order order = orders.findById(orderId)
                .orElseThrow(() -> new NoSuchElementException("Order not found"));

        if (!order.getFarmer().getId().equals(farmerId)) {
            throw new AccessDeniedException("Forbidden");
        }

        OrderStatus target;

        try {
            target = OrderStatus.valueOf(request.status().trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Unknown order status.");
        }

        LocalDate newDate = parseDate(request.expectedDeliveryDate());
        OrderStatus current = order.getStatus();

        // Only the expected delivery date is changing.
        if (target == current) {
            if (newDate == null || current == OrderStatus.DELIVERED || current == OrderStatus.CANCELLED) {
                throw new IllegalArgumentException("The order is already " + label(current) + ".");
            }

            order.setExpectedDeliveryDate(newDate);
            order.setUpdatedAt(Instant.now());
            orders.save(order);

            notifications.orderEvent(
                    order.getConsumer(),
                    "Delivery date updated",
                    "New expected delivery date for order " + number(order)
                            + ": " + DATE_FORMAT.format(newDate) + ".",
                    order.getId()
            );

            return toViews(List.of(order)).get(0);
        }

        if (!canMove(current, target)) {
            throw new IllegalArgumentException(
                    "Cannot change an order from " + label(current) + " to " + label(target) + ".");
        }

        if (newDate != null) {
            order.setExpectedDeliveryDate(newDate);
        }

        if (target == OrderStatus.CANCELLED) {
            cancel(order);

            notifications.orderEvent(
                    order.getConsumer(),
                    "Order cancelled by the farmer",
                    "Sorry, " + order.getFarmer().getName() + " could not fulfil order "
                            + number(order) + ". It has been cancelled.",
                    order.getId()
            );

            return toViews(List.of(order)).get(0);
        }

        order.setStatus(target);
        order.setUpdatedAt(Instant.now());

        if (target == OrderStatus.DELIVERED) {
            order.setDeliveredAt(Instant.now());

            // Cash on delivery is collected at the door.
            if ("COD".equals(order.getPaymentMethod())) {
                order.setPaymentStatus(PaymentStatus.PAID);
            }
        }

        orders.save(order);

        notifications.orderEvent(
                order.getConsumer(),
                statusTitle(target),
                statusMessage(order, target),
                order.getId()
        );

        return toViews(List.of(order)).get(0);
    }

    // ==================================================================
    // HELPERS
    // ==================================================================

    private void cancel(Order order) {
        for (OrderItem line : orderItems.findByOrderId(order.getId())) {
            inventory.findByProductId(line.getProduct().getId()).ifPresent(stock -> {
                stock.setQuantity(stock.getQuantity() + line.getQuantity());
                inventory.save(stock);
            });
        }

        order.setStatus(OrderStatus.CANCELLED);
        order.setCancelledAt(Instant.now());
        order.setUpdatedAt(Instant.now());

        if (order.getPaymentStatus() == PaymentStatus.PAID) {
            order.setPaymentStatus(PaymentStatus.REFUNDED);
        }

        orders.save(order);
    }

    private static boolean isConsumerCancellable(OrderStatus status) {
        return status == OrderStatus.PLACED || status == OrderStatus.CONFIRMED;
    }

    /** Orders only move forward; they can be cancelled until they are shipped. */
    private static boolean canMove(OrderStatus from, OrderStatus to) {
        if (from == OrderStatus.DELIVERED || from == OrderStatus.CANCELLED) {
            return false;
        }

        if (to == OrderStatus.CANCELLED) {
            return from.ordinal() < OrderStatus.SHIPPED.ordinal();
        }

        return to.ordinal() > from.ordinal();
    }

    private static List<String> nextStatuses(OrderStatus current) {
        List<String> next = new ArrayList<>();

        for (OrderStatus status : OrderStatus.values()) {
            if (status != current && canMove(current, status)) {
                next.add(status.name());
            }
        }

        return next;
    }

    private static LocalDate parseDate(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        try {
            LocalDate date = LocalDate.parse(value.trim());

            if (date.isBefore(LocalDate.now(INDIA))) {
                throw new IllegalArgumentException("Delivery date cannot be in the past.");
            }

            return date;
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("Delivery date must look like 2026-10-25.");
        }
    }

    private static String number(Order order) {
        return String.format("KC-%06d", order.getId());
    }

    private static String label(OrderStatus status) {
        return switch (status) {
            case PLACED -> "placed";
            case CONFIRMED -> "confirmed";
            case PROCESSING -> "being prepared";
            case READY_FOR_DISPATCH -> "ready for dispatch";
            case SHIPPED -> "shipped";
            case DELIVERED -> "delivered";
            case CANCELLED -> "cancelled";
        };
    }

    private static String statusTitle(OrderStatus status) {
        return switch (status) {
            case CONFIRMED -> "Order confirmed";
            case PROCESSING -> "Order is being prepared";
            case READY_FOR_DISPATCH -> "Order ready for dispatch";
            case SHIPPED -> "Order shipped";
            case DELIVERED -> "Order delivered";
            default -> "Order update";
        };
    }

    private static String statusMessage(Order order, OrderStatus status) {
        String no = number(order);
        String by = order.getExpectedDeliveryDate() == null
                ? ""
                : " Expected delivery by " + DATE_FORMAT.format(order.getExpectedDeliveryDate()) + ".";

        return switch (status) {
            case CONFIRMED -> order.getFarmer().getName() + " confirmed your order " + no + "." + by;
            case PROCESSING -> "Your order " + no + " is being prepared." + by;
            case READY_FOR_DISPATCH -> "Your order " + no + " is packed and ready for dispatch." + by;
            case SHIPPED -> "Your order " + no + " is on its way." + by;
            case DELIVERED -> "Your order " + no + " was delivered. Thank you for buying from farmers directly!";
            default -> "Your order " + no + " is now " + label(status) + ".";
        };
    }

    private static String formatAddress(Address a) {
        StringBuilder text = new StringBuilder(a.getLine1());

        if (a.getLine2() != null && !a.getLine2().isBlank()) {
            text.append(", ").append(a.getLine2());
        }

        text.append(", ").append(a.getCity())
                .append(", ").append(a.getState())
                .append(" - ").append(a.getPostalCode())
                .append(", ").append(a.getCountry());

        return text.toString();
    }

    // ------------------------------------------------------------------
    // Entity -> DTO (must run inside a transaction: relations are lazy)
    // ------------------------------------------------------------------

    private List<OrderView> toViews(List<Order> list) {
        if (list.isEmpty()) {
            return List.of();
        }

        List<Long> ids = list.stream().map(Order::getId).toList();

        Map<Long, List<OrderItem>> linesByOrder = orderItems.findByOrderIdIn(ids)
                .stream()
                .collect(Collectors.groupingBy(line -> line.getOrder().getId()));

        List<OrderView> views = new ArrayList<>();

        for (Order order : list) {
            List<OrderItemView> lines = linesByOrder
                    .getOrDefault(order.getId(), List.of())
                    .stream()
                    .map(OrderService::toLine)
                    .toList();

            views.add(new OrderView(
                    order.getId(),
                    number(order),
                    order.getStatus().name(),
                    order.getPaymentMethod(),
                    order.getPaymentStatus().name(),
                    order.getTotalAmount(),
                    order.getExpectedDeliveryDate(),
                    order.getCreatedAt(),
                    order.getUpdatedAt(),
                    order.getDeliveredAt(),
                    order.getCancelledAt(),
                    order.getShippingName(),
                    order.getShippingPhone(),
                    order.getShippingAddress(),
                    new PartyView(order.getConsumer().getId(), order.getConsumer().getName()),
                    new PartyView(order.getFarmer().getId(), order.getFarmer().getName()),
                    lines,
                    isConsumerCancellable(order.getStatus()),
                    nextStatuses(order.getStatus())
            ));
        }

        return views;
    }

    private static OrderItemView toLine(OrderItem line) {
        Product product = line.getProduct();

        String image = product.getImages().isEmpty()
                ? null
                : product.getImages().get(0).getUrl();

        return new OrderItemView(
                line.getId(),
                product.getId(),
                line.getProductName(),
                image,
                product.getUnit(),
                line.getUnitPrice(),
                line.getQuantity(),
                line.getLineTotal()
        );
    }
}
