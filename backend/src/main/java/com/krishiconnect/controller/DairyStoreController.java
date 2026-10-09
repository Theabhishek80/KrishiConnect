package com.krishiconnect.controller;

import com.krishiconnect.dto.DairyDtos.*;
import com.krishiconnect.dto.DairyStoreRequest;
import com.krishiconnect.service.DairyCatalogService;
import com.krishiconnect.service.DairyOrderService;
import com.krishiconnect.service.DairyStoreService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Dairy marketplace API.
 *
 * Public  : browse stores, products, reviews
 * Signed in: register ONE store, manage products, review, order, subscribe
 */
@RestController
@RequestMapping("/api/dairy")
public class DairyStoreController {

    private final DairyStoreService storeService;
    private final DairyCatalogService catalog;
    private final DairyOrderService orderService;

    public DairyStoreController(
            DairyStoreService storeService,
            DairyCatalogService catalog,
            DairyOrderService orderService
    ) {
        this.storeService = storeService;
        this.catalog = catalog;
        this.orderService = orderService;
    }

    // ================= STORES (public) =================

    // GET /api/dairy/stores?city=Bhopal&postalCode=462001&lat=23.25&lng=77.41
    // All params optional. Result is ranked by consumer reviews.
    @GetMapping("/stores")
    public List<StoreView> stores(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String postalCode,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng
    ) {
        return storeService.search(city, postalCode, lat, lng);
    }

    @GetMapping("/stores/{id}")
    public StoreView store(@PathVariable Long id) {
        return storeService.getStoreView(id);
    }

    @GetMapping("/stores/{id}/products")
    public List<ProductView> storeProducts(@PathVariable Long id) {
        return catalog.publicProducts(id);
    }

    @GetMapping("/stores/{id}/reviews")
    public ReviewsResponse storeReviews(@PathVariable Long id) {
        return catalog.reviewsFor(id);
    }

    // ================= STORES (signed in) =================

    @PostMapping("/stores")
    public ResponseEntity<StoreView> createStore(
            Authentication auth,
            @Valid @RequestBody DairyStoreRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(storeService.createStore(auth, request));
    }

    @GetMapping("/stores/mine")
    public List<StoreView> myStores(Authentication auth) {
        return storeService.getMyStores(auth);
    }

    @PutMapping("/stores/{id}")
    public StoreView updateStore(
            @PathVariable Long id,
            Authentication auth,
            @Valid @RequestBody DairyStoreRequest request
    ) {
        return storeService.updateStore(auth, id, request);
    }

    @PostMapping("/stores/{id}/reviews")
    public ReviewsResponse review(
            @PathVariable Long id,
            Authentication auth,
            @Valid @RequestBody ReviewRequest request
    ) {
        return catalog.review(auth, id, request);
    }

    // ================= PRODUCTS (store owner) =================

    @GetMapping("/my-store/products")
    public List<ProductView> myProducts(Authentication auth) {
        return catalog.myProducts(auth);
    }

    @PostMapping("/products")
    public ResponseEntity<ProductView> addProduct(
            Authentication auth,
            @Valid @RequestBody ProductRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(catalog.create(auth, request));
    }

    @PutMapping("/products/{id}")
    public ProductView updateProduct(
            @PathVariable Long id,
            Authentication auth,
            @Valid @RequestBody ProductRequest request
    ) {
        return catalog.update(auth, id, request);
    }

    @DeleteMapping("/products/{id}")
    public ResponseEntity<Void> deleteProduct(
            @PathVariable Long id,
            Authentication auth
    ) {
        catalog.delete(auth, id);
        return ResponseEntity.noContent().build();
    }

    // ================= ORDERS =================

    @PostMapping("/orders")
    public ResponseEntity<OrderView> placeOrder(
            Authentication auth,
            @Valid @RequestBody OrderRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(orderService.placeOrder(auth, request));
    }

    @GetMapping("/orders/mine")
    public List<OrderView> myOrders(Authentication auth) {
        return orderService.myOrders(auth);
    }

    @GetMapping("/orders/store")
    public List<OrderView> storeOrders(Authentication auth) {
        return orderService.storeOrders(auth);
    }

    @PatchMapping("/orders/{id}/status")
    public OrderView orderStatus(
            @PathVariable Long id,
            Authentication auth,
            @Valid @RequestBody StatusRequest request
    ) {
        return orderService.updateOrderStatus(auth, id, request.status());
    }

    // ================= SUBSCRIPTIONS =================

    @PostMapping("/subscriptions")
    public ResponseEntity<SubscriptionView> subscribe(
            Authentication auth,
            @Valid @RequestBody SubscriptionRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(orderService.subscribe(auth, request));
    }

    @GetMapping("/subscriptions/mine")
    public List<SubscriptionView> mySubscriptions(Authentication auth) {
        return orderService.mySubscriptions(auth);
    }

    @GetMapping("/subscriptions/store")
    public List<SubscriptionView> storeSubscriptions(Authentication auth) {
        return orderService.storeSubscriptions(auth);
    }

    @PatchMapping("/subscriptions/{id}/status")
    public SubscriptionView subscriptionStatus(
            @PathVariable Long id,
            Authentication auth,
            @Valid @RequestBody StatusRequest request
    ) {
        return orderService.updateSubscriptionStatus(auth, id, request.status());
    }
}
