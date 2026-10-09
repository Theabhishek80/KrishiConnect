package com.krishiconnect.service;

import com.krishiconnect.dto.DairyDtos.StoreView;
import com.krishiconnect.dto.DairyStoreRequest;
import com.krishiconnect.entity.DairyStore;
import com.krishiconnect.entity.User;
import com.krishiconnect.repository.DairyProductRepository;
import com.krishiconnect.repository.DairyStoreRepository;
import com.krishiconnect.repository.DairyStoreReviewRepository;
import com.krishiconnect.repository.UserRepository;
import com.krishiconnect.security.AuthContext;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@Service
public class DairyStoreService {

    // Bayesian average: a store with a single 5-star review should not
    // outrank a store with 40 reviews averaging 4.7.
    private static final double PRIOR_RATING = 3.5;
    private static final double PRIOR_WEIGHT = 3.0;

    private final DairyStoreRepository stores;
    private final DairyStoreReviewRepository reviews;
    private final DairyProductRepository products;
    private final UserRepository users;
    private final AuthContext authContext;

    public DairyStoreService(
            DairyStoreRepository stores,
            DairyStoreReviewRepository reviews,
            DairyProductRepository products,
            UserRepository users,
            AuthContext authContext
    ) {
        this.stores = stores;
        this.reviews = reviews;
        this.products = products;
        this.users = users;
        this.authContext = authContext;
    }

    // --------------------------------------------------
    // DISCOVERY - location filter + ranking by reviews
    // --------------------------------------------------

    @Transactional(readOnly = true)
    public List<StoreView> search(
            String city, String postalCode, Double lat, Double lng
    ) {
        String cityQ = blankToNull(city);
        String postalQ = blankToNull(postalCode);
        boolean hasCoords = lat != null && lng != null;
        boolean hasLocation = cityQ != null || postalQ != null || hasCoords;

        Map<Long, double[]> ratings = ratingMap();
        Map<Long, Long> productCounts = productCountMap();

        return stores.findByActiveTrueOrderByStoreNameAsc().stream()
                .map(s -> {
                    Double distance = null;
                    if (hasCoords && s.getLatitude() != null && s.getLongitude() != null) {
                        distance = haversineKm(lat, lng, s.getLatitude(), s.getLongitude());
                    }
                    return new Object[]{s, distance};
                })
                .filter(pair -> {
                    if (!hasLocation) return true;
                    DairyStore s = (DairyStore) pair[0];
                    Double d = (Double) pair[1];
                    if (postalQ != null && postalQ.equals(s.getPostalCode())) return true;
                    if (cityQ != null && cityQ.equalsIgnoreCase(s.getCity())) return true;
                    double radius = s.getDeliveryRadiusKm() == null ? 5.0 : s.getDeliveryRadiusKm();
                    return d != null && d <= radius;
                })
                .map(pair -> toView(
                        (DairyStore) pair[0], (Double) pair[1], ratings, productCounts))
                .sorted((a, b) -> {
                    int byScore = Double.compare(score(b), score(a));
                    if (byScore != 0) return byScore;
                    int byCount = Long.compare(b.reviewCount(), a.reviewCount());
                    if (byCount != 0) return byCount;
                    return b.createdAt().compareTo(a.createdAt());
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public StoreView getStoreView(Long id) {
        DairyStore store = getActiveStore(id);
        return toView(store, null, ratingMap(), productCountMap());
    }

    @Transactional(readOnly = true)
    public DairyStore getActiveStore(Long id) {
        return stores.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new NoSuchElementException("Dairy store not found."));
    }

    // --------------------------------------------------
    // REGISTER / UPDATE (one store per user)
    // --------------------------------------------------

    @Transactional
    public StoreView createStore(Authentication auth, DairyStoreRequest request) {
        User owner = requireUser(auth);

        if (!stores.findByOwner_IdOrderByCreatedAtDesc(owner.getId()).isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "You already have a dairy store.");
        }

        DairyStore store = new DairyStore();
        store.setOwner(owner);
        applyRequest(store, request);
        store.setActive(true);

        DairyStore saved = stores.save(store);
        return toView(saved, null, Map.of(), Map.of());
    }

    @Transactional(readOnly = true)
    public List<StoreView> getMyStores(Authentication auth) {
        Long userId = authContext.userId(auth);
        Map<Long, double[]> ratings = ratingMap();
        Map<Long, Long> counts = productCountMap();
        return stores.findByOwner_IdOrderByCreatedAtDesc(userId).stream()
                .map(s -> toView(s, null, ratings, counts))
                .toList();
    }

    @Transactional
    public StoreView updateStore(Authentication auth, Long storeId, DairyStoreRequest request) {
        Long userId = authContext.userId(auth);

        DairyStore store = stores.findById(storeId)
                .orElseThrow(() -> new NoSuchElementException("Dairy store not found."));

        if (store.getOwner() == null || !store.getOwner().getId().equals(userId)) {
            throw new AccessDeniedException("You cannot update another user's store.");
        }

        applyRequest(store, request);
        DairyStore saved = stores.save(store);
        return toView(saved, null, ratingMap(), productCountMap());
    }

    // --------------------------------------------------
    // HELPERS shared with other dairy services
    // --------------------------------------------------

    public User requireUser(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new AccessDeniedException("Please sign in first.");
        }
        Long userId = authContext.userId(auth);
        User user = users.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("Authenticated user not found."));
        if (!user.isEnabled()) {
            throw new AccessDeniedException("This account is disabled.");
        }
        return user;
    }

    public DairyStore requireOwnStore(Authentication auth) {
        Long userId = authContext.userId(auth);
        List<DairyStore> mine = stores.findByOwner_IdOrderByCreatedAtDesc(userId);
        if (mine.isEmpty()) {
            throw new NoSuchElementException("You have not registered a dairy store yet.");
        }
        return mine.get(0);
    }

    // --------------------------------------------------
    // INTERNALS
    // --------------------------------------------------

    private StoreView toView(
            DairyStore s,
            Double distanceKm,
            Map<Long, double[]> ratings,
            Map<Long, Long> productCounts
    ) {
        double[] agg = ratings.getOrDefault(s.getId(), new double[]{0, 0});
        long days = Math.max(0, Duration.between(s.getCreatedAt(), Instant.now()).toDays());

        return new StoreView(
                s.getId(),
                s.getStoreName(),
                s.getDescription(),
                s.getPhone(),
                s.getAddressLine(),
                s.getCity(),
                s.getState(),
                s.getPostalCode(),
                s.getLatitude(),
                s.getLongitude(),
                s.getDeliveryRadiusKm(),
                s.getOperatingDays(),
                s.isActive(),
                s.getCreatedAt(),
                days,
                Math.round(agg[0] * 10.0) / 10.0,
                (long) agg[1],
                productCounts.getOrDefault(s.getId(), 0L),
                distanceKm == null ? null : Math.round(distanceKm * 10.0) / 10.0,
                s.getOwner() == null ? null : s.getOwner().getName()
        );
    }

    private static double score(StoreView v) {
        return (v.averageRating() * v.reviewCount() + PRIOR_RATING * PRIOR_WEIGHT)
                / (v.reviewCount() + PRIOR_WEIGHT);
    }

    private Map<Long, double[]> ratingMap() {
        Map<Long, double[]> map = new HashMap<>();
        for (Object[] row : reviews.aggregateAll()) {
            map.put((Long) row[0], new double[]{
                    ((Number) row[1]).doubleValue(),
                    ((Number) row[2]).doubleValue()
            });
        }
        return map;
    }

    private Map<Long, Long> productCountMap() {
        Map<Long, Long> map = new HashMap<>();
        for (Object[] row : products.countAvailableByStore()) {
            map.put((Long) row[0], ((Number) row[1]).longValue());
        }
        return map;
    }

    private static double haversineKm(double lat1, double lon1, double lat2, double lon2) {
        double r = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return r * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    private static String blankToNull(String v) {
        return v == null || v.isBlank() ? null : v.trim();
    }

    private void applyRequest(DairyStore store, DairyStoreRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Store request cannot be empty.");
        }
        store.setStoreName(request.storeName().trim());
        store.setDescription(request.description());
        store.setPhone(request.phone());
        store.setAddressLine(request.addressLine().trim());
        store.setCity(request.city().trim());
        store.setState(request.state().trim());
        store.setPostalCode(request.postalCode().trim());
        store.setLatitude(request.latitude());
        store.setLongitude(request.longitude());

        if (request.deliveryRadiusKm() != null) {
            store.setDeliveryRadiusKm(request.deliveryRadiusKm());
        } else if (store.getDeliveryRadiusKm() == null) {
            store.setDeliveryRadiusKm(5.0);
        }
        store.setOperatingDays(request.operatingDays());
    }
}
