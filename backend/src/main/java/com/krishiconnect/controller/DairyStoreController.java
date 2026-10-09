
package com.krishiconnect.controller;

import com.krishiconnect.dto.DairyStoreRequest;
import com.krishiconnect.entity.DairyStore;
import com.krishiconnect.service.DairyStoreService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/dairy/stores")
public class DairyStoreController {

    private final DairyStoreService dairyStoreService;

    public DairyStoreController(
            DairyStoreService dairyStoreService
    ) {
        this.dairyStoreService = dairyStoreService;
    }

    // --------------------------------------------------
    // PUBLIC STORE DISCOVERY
    // --------------------------------------------------

    // GET /api/dairy/stores
    @GetMapping
    public List<DairyStore> getActiveStores() {
        return dairyStoreService.getActiveStores();
    }

    // GET /api/dairy/stores?city=Indore&state=Madhya Pradesh
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
                    HttpStatus.BAD_REQUEST,
                    ex.getMessage()
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
    public DairyStore getStoreById(
            @PathVariable Long id
    ) {
        try {
            return dairyStoreService.getActiveStoreById(id);
        } catch (NoSuchElementException ex) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    ex.getMessage()
            );
        }
    }

    // --------------------------------------------------
    // DAIRY STORE REGISTRATION
    // Any authenticated user can register.
    // No FARMER role is required.
    // --------------------------------------------------

    // POST /api/dairy/stores
    @PostMapping
    public ResponseEntity<DairyStore> createStore(
            Authentication authentication,
            @Valid @RequestBody DairyStoreRequest request
    ) {
        DairyStore store = dairyStoreService.createStore(
                authentication, request
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(store);
    }

    // --------------------------------------------------
    // CURRENT USER'S STORES
    // --------------------------------------------------

    // GET /api/dairy/stores/mine
    @GetMapping("/mine")
    public List<DairyStore> getMyStores(
            Authentication authentication
    ) {
        return dairyStoreService.getMyStores(authentication);
    }

    // --------------------------------------------------
    // UPDATE OWN STORE
    // --------------------------------------------------

    // PUT /api/dairy/stores/12
    @PutMapping("/{id}")
    public DairyStore updateStore(
            @PathVariable Long id,
            Authentication authentication,
            @Valid @RequestBody DairyStoreRequest request
    ) {
        try {
            return dairyStoreService.updateStore(
                    authentication, id, request
            );
        } catch (NoSuchElementException ex) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    ex.getMessage()
            );
        }
    }
}

