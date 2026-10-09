
package com.krishiconnect.controller;

import com.krishiconnect.entity.DairyStore;
import com.krishiconnect.service.DairyStoreService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/dairy/stores")
public class DairyStoreController {

    private final DairyStoreService dairyStoreService;

    public DairyStoreController(
            DairyStoreService dairyStoreService
    ) {
        this.dairyStoreService = dairyStoreService;
    }

    // GET /api/dairy/stores
    // Returns active stores.
    @GetMapping
    public List<DairyStore> getActiveStores() {
        return dairyStoreService.getActiveStores();
    }

    // GET /api/dairy/stores?city=Indore&state=Madhya%20Pradesh
    @GetMapping(params = {"city", "state"})
    public List<DairyStore> getStoresByCity(
            @RequestParam String city,
            @RequestParam String state
    ) {
        try {
            return dairyStoreService.getStoresByLocation(
                    city, state, null
            );
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, ex.getMessage()
            );
        }
    }

    // GET /api/dairy/stores?postalCode=452001
    @GetMapping(params = "postalCode")
    public List<DairyStore> getStoresByPostalCode(
            @RequestParam String postalCode
    ) {
        if (postalCode.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Postal code cannot be blank."
            );
        }

        return dairyStoreService.getStoresByLocation(
                null, null, postalCode
        );
    }

    // GET /api/dairy/stores/12
    @GetMapping("/{id}")
    public DairyStore getStoreById(@PathVariable Long id) {
        try {
            return dairyStoreService.getActiveStoreById(id);
        } catch (java.util.NoSuchElementException ex) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, ex.getMessage()
            );
        }
    }
}
