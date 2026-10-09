
package com.krishiconnect.service;

import com.krishiconnect.entity.DairyStore;
import com.krishiconnect.repository.DairyStoreRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class DairyStoreService {

    private final DairyStoreRepository dairyStoreRepository;

    public DairyStoreService(
            DairyStoreRepository dairyStoreRepository
    ) {
        this.dairyStoreRepository = dairyStoreRepository;
    }

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
                        new java.util.NoSuchElementException(
                                "Active dairy store not found."
                        )
                );
    }
}
