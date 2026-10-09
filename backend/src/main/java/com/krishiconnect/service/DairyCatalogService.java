package com.krishiconnect.service;

import com.krishiconnect.dto.DairyDtos.*;
import com.krishiconnect.entity.DairyProduct;
import com.krishiconnect.entity.DairyStore;
import com.krishiconnect.entity.DairyStoreReview;
import com.krishiconnect.entity.User;
import com.krishiconnect.repository.DairyProductRepository;
import com.krishiconnect.repository.DairyStoreReviewRepository;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Set;

/** Products (managed by the store owner) and whole-store reviews. */
@Service
public class DairyCatalogService {

    private static final Set<String> CATEGORIES = Set.of(
            "MILK", "CURD", "GHEE", "PANEER", "BUTTER", "BUTTERMILK", "OTHER");

    private final DairyProductRepository products;
    private final DairyStoreReviewRepository reviews;
    private final DairyStoreService storeService;

    public DairyCatalogService(
            DairyProductRepository products,
            DairyStoreReviewRepository reviews,
            DairyStoreService storeService
    ) {
        this.products = products;
        this.reviews = reviews;
        this.storeService = storeService;
    }

    // ---------------- PRODUCTS ----------------

    @Transactional(readOnly = true)
    public List<ProductView> publicProducts(Long storeId) {
        storeService.getActiveStore(storeId);
        return products.findByStore_IdAndAvailableTrueOrderByCategoryAscNameAsc(storeId)
                .stream().map(DairyCatalogService::toView).toList();
    }

    @Transactional(readOnly = true)
    public List<ProductView> myProducts(Authentication auth) {
        DairyStore store = storeService.requireOwnStore(auth);
        return products.findByStore_IdOrderByCreatedAtDesc(store.getId())
                .stream().map(DairyCatalogService::toView).toList();
    }

    @Transactional
    public ProductView create(Authentication auth, ProductRequest req) {
        DairyStore store = storeService.requireOwnStore(auth);
        DairyProduct p = new DairyProduct();
        p.setStore(store);
        apply(p, req);
        return toView(products.save(p));
    }

    @Transactional
    public ProductView update(Authentication auth, Long productId, ProductRequest req) {
        DairyProduct p = ownedProduct(auth, productId);
        apply(p, req);
        return toView(products.save(p));
    }

    @Transactional
    public void delete(Authentication auth, Long productId) {
        DairyProduct p = ownedProduct(auth, productId);
        try {
            products.delete(p);
            products.flush();
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            // Product already has orders/subscriptions: hide it instead of deleting.
            throw new IllegalArgumentException(
                    "This product has orders or subscriptions, so it can't be deleted. "
                            + "Mark it as unavailable instead.");
        }
    }

    private DairyProduct ownedProduct(Authentication auth, Long productId) {
        DairyStore store = storeService.requireOwnStore(auth);
        DairyProduct p = products.findById(productId)
                .orElseThrow(() -> new NoSuchElementException("Product not found."));
        if (!p.getStore().getId().equals(store.getId())) {
            throw new AccessDeniedException("This product belongs to another store.");
        }
        return p;
    }

    private void apply(DairyProduct p, ProductRequest r) {
        String category = r.category().trim().toUpperCase();
        if (!CATEGORIES.contains(category)) {
            throw new IllegalArgumentException("Unknown category: " + r.category());
        }

        boolean subEnabled = Boolean.TRUE.equals(r.subscriptionEnabled());
        if (subEnabled) {
            if (r.monthlySubscriptionPrice() == null
                    || r.subscriptionQuantityPerDay() == null) {
                throw new IllegalArgumentException(
                        "Enter the daily quantity and the monthly price for the subscription.");
            }
        }

        p.setName(r.name().trim());
        p.setDescription(r.description() == null ? null : r.description().trim());
        p.setCategory(category);
        p.setPrice(r.price());
        p.setUnit(r.unit().trim());
        p.setStockQuantity(r.stockQuantity());
        p.setAvailable(r.available() == null || r.available());
        p.setSubscriptionEnabled(subEnabled);
        p.setSubscriptionQuantityPerDay(subEnabled ? r.subscriptionQuantityPerDay() : null);
        p.setMonthlySubscriptionPrice(subEnabled ? r.monthlySubscriptionPrice() : null);
    }

    static ProductView toView(DairyProduct p) {
        return new ProductView(
                p.getId(), p.getStore().getId(), p.getName(), p.getDescription(),
                p.getCategory(), p.getPrice(), p.getUnit(), p.getStockQuantity(),
                p.isAvailable(), p.isSubscriptionEnabled(),
                p.getSubscriptionQuantityPerDay(), p.getMonthlySubscriptionPrice(),
                p.getCreatedAt());
    }

    // ---------------- REVIEWS ----------------

    @Transactional(readOnly = true)
    public ReviewsResponse reviewsFor(Long storeId) {
        storeService.getActiveStore(storeId);
        List<ReviewView> list = reviews.findByStore_IdOrderByCreatedAtDesc(storeId).stream()
                .map(r -> new ReviewView(
                        r.getId(), r.getUser().getId(), r.getUser().getName(),
                        r.getRating(), r.getComment(), r.getCreatedAt()))
                .toList();

        double avg = list.stream().mapToInt(ReviewView::rating).average().orElse(0);
        return new ReviewsResponse(Math.round(avg * 10.0) / 10.0, list.size(), list);
    }

    /** One review per user per store; posting again edits the earlier one. */
    @Transactional
    public ReviewsResponse review(Authentication auth, Long storeId, ReviewRequest req) {
        User user = storeService.requireUser(auth);
        DairyStore store = storeService.getActiveStore(storeId);

        if (store.getOwner() != null && store.getOwner().getId().equals(user.getId())) {
            throw new IllegalArgumentException("You can't review your own store.");
        }

        DairyStoreReview review = reviews
                .findByStore_IdAndUser_Id(storeId, user.getId())
                .orElseGet(() -> {
                    DairyStoreReview r = new DairyStoreReview();
                    r.setStore(store);
                    r.setUser(user);
                    return r;
                });

        review.setRating(req.rating());
        String comment = req.comment() == null ? null : req.comment().trim();
        review.setComment(comment == null || comment.isEmpty() ? null : comment);
        reviews.save(review);

        return reviewsFor(storeId);
    }
}
