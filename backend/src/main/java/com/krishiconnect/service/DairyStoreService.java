
package com.krishiconnect.service;

import com.krishiconnect.domain.Role;
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
    // CREATE STORE
    // --------------------------------------------------

    @Transactional
    public DairyStore createStore(
            Authentication authentication,
            DairyStoreRequest request
    ) {
        User owner = getAuthenticatedFarmer(authentication);

        DairyStore store = new DairyStore();
        store.setOwner(owner);

        applyRequest(store, request);

        // New stores are active by default in the current entity.
        // Review/approval workflow can be added separately.
        store.setActive(true);

        return dairyStoreRepository.save(store);
    }

    // --------------------------------------------------
    // GET CURRENT FARMER'S STORES
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
                    "You cannot update another farmer's store."
            );
        }

        applyRequest(store, request);

        // Do not allow a normal update to change the store's
        // activation status.
        return dairyStoreRepository.save(store);
    }

    // --------------------------------------------------
    // AUTHENTICATION AND ROLE VALIDATION
    // --------------------------------------------------

    private User getAuthenticatedFarmer(
            Authentication authentication
    ) {
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

        if (owner.getRole() != Role.FARMER) {
            throw new AccessDeniedException(
                    "Only farmers can manage dairy stores."
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
