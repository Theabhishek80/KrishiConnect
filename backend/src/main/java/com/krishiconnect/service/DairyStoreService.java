
package com.krishiconnect.service;

import com.krishiconnect.dto.DairyStoreRequest;
import com.krishiconnect.entity.DairyStore;
import com.krishiconnect.entity.User;
import com.krishiconnect.repository.DairyStoreRepository;
import com.krishiconnect.repository.UserRepository;
import com.krishiconnect.security.AuthContext;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Service
public class DairyStoreService {

    private final DairyStoreRepository dairyStoreRepository;
    private final UserRepository userRepository;
    private final AuthContext authContext;

    public DairyStoreService(
            DairyStoreRepository dairyStoreRepository,
            UserRepository userRepository,
            AuthContext authContext
    ) {
        this.dairyStoreRepository = dairyStoreRepository;
        this.userRepository = userRepository;
        this.authContext = authContext;
    }

    // --------------------------------------------------
    // PUBLIC STORE DISCOVERY
    // --------------------------------------------------

    @Transactional(readOnly = true)
    public List<DairyStore> getActiveStores() {
        return dairyStoreRepository
                .findByActiveTrueOrderByStoreNameAsc();
    }

    @Transactional(readOnly = true)
    public List<DairyStore> getStoresByLocation(
            String city,
            String state,
            String postalCode
    ) {
        if (postalCode != null && !postalCode.isBlank()) {
            return dairyStoreRepository
                    .findActiveStoresByPostalCode(
                            postalCode.trim()
                    );
        }

        if (city == null || city.isBlank()
                || state == null || state.isBlank()) {
            throw new IllegalArgumentException(
                    "Provide a postal code or both city and state."
            );
        }

        return dairyStoreRepository
                .findActiveStoresByCityAndState(
                        city.trim(),
                        state.trim()
                );
    }

    @Transactional(readOnly = true)
    public DairyStore getActiveStoreById(Long id) {
        return dairyStoreRepository
                .findByIdAndActiveTrue(id)
                .orElseThrow(() ->
                        new NoSuchElementException(
                                "Active dairy store not found."
                        )
                );
    }

    // --------------------------------------------------
    // REGISTER DAIRY STORE
    // Any enabled, authenticated user may register.
    // FARMER role is not required for this feature.
    // --------------------------------------------------

    @Transactional
    public DairyStore createStore(
            Authentication authentication,
            DairyStoreRequest request
    ) {
        User owner = getAuthenticatedUser(authentication);

        DairyStore store = new DairyStore();
        store.setOwner(owner);

        applyRequest(store, request);
        store.setActive(true);

        return dairyStoreRepository.save(store);
    }

    // --------------------------------------------------
    // GET CURRENT USER'S STORES
    // --------------------------------------------------

    @Transactional(readOnly = true)
    public List<DairyStore> getMyStores(
            Authentication authentication
    ) {
        Long userId = authContext.userId(authentication);

        return dairyStoreRepository
                .findByOwner_IdOrderByCreatedAtDesc(userId);
    }

    // --------------------------------------------------
    // UPDATE OWN STORE
    // Only the owner can update their store.
    // --------------------------------------------------

    @Transactional
    public DairyStore updateStore(
            Authentication authentication,
            Long storeId,
            DairyStoreRequest request
    ) {
        Long userId = authContext.userId(authentication);

        DairyStore store = dairyStoreRepository.findById(storeId)
                .orElseThrow(() ->
                        new NoSuchElementException(
                                "Dairy store not found."
                        )
                );

        if (store.getOwner() == null
                || !store.getOwner().getId().equals(userId)) {
            throw new AccessDeniedException(
                    "You cannot update another user's store."
            );
        }

        applyRequest(store, request);

        // A normal update must not change activation status.
        return dairyStoreRepository.save(store);
    }

    // --------------------------------------------------
    // AUTHENTICATION AND ACCOUNT VALIDATION
    // --------------------------------------------------

    private User getAuthenticatedUser(
            Authentication authentication
    ) {
        if (authentication == null
                || !authentication.isAuthenticated()) {
            throw new AccessDeniedException(
                    "Please sign in to register a dairy store."
            );
        }

        Long userId = authContext.userId(authentication);

        User owner = userRepository.findById(userId)
                .orElseThrow(() ->
                        new NoSuchElementException(
                                "Authenticated user not found."
                        )
                );

        if (!owner.isEnabled()) {
            throw new AccessDeniedException(
                    "This account is disabled."
            );
        }

        return owner;
    }

    // --------------------------------------------------
    // REQUEST MAPPING
    // --------------------------------------------------

    private void applyRequest(
            DairyStore store,
            DairyStoreRequest request
    ) {
        if (request == null) {
            throw new IllegalArgumentException(
                    "Store request cannot be empty."
            );
        }

        if (request.storeName() == null
                || request.storeName().isBlank()) {
            throw new IllegalArgumentException(
                    "Store name is required."
            );
        }

        if (request.addressLine() == null
                || request.addressLine().isBlank()) {
            throw new IllegalArgumentException(
                    "Address is required."
            );
        }

        if (request.city() == null || request.city().isBlank()) {
            throw new IllegalArgumentException(
                    "City is required."
            );
        }

        if (request.state() == null || request.state().isBlank()) {
            throw new IllegalArgumentException(
                    "State is required."
            );
        }

        if (request.postalCode() == null
                || request.postalCode().isBlank()) {
            throw new IllegalArgumentException(
                    "Postal code is required."
            );
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
            store.setDeliveryRadiusKm(
                    request.deliveryRadiusKm()
            );
        } else if (store.getDeliveryRadiusKm() == null) {
            store.setDeliveryRadiusKm(5.0);
        }

        store.setOperatingDays(request.operatingDays());
    }
}
