package com.krishiconnect.controller;

import com.krishiconnect.dto.AddressDtos.AddressRequest;
import com.krishiconnect.security.AuthContext;
import com.krishiconnect.service.AddressService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/addresses")
public class AddressController {

    private final AddressService service;
    private final AuthContext context;

    public AddressController(AddressService service, AuthContext context) {
        this.service = service;
        this.context = context;
    }

    @GetMapping
    public Object list(Authentication a) {
        return service.list(context.userId(a));
    }

    @PostMapping
    public Object create(Authentication a, @Valid @RequestBody AddressRequest request) {
        return service.create(context.userId(a), request);
    }

    @PutMapping("/{id}")
    public Object update(Authentication a, @PathVariable Long id,
                         @Valid @RequestBody AddressRequest request) {
        return service.update(context.userId(a), id, request);
    }

    @PatchMapping("/{id}/default")
    public Object makeDefault(Authentication a, @PathVariable Long id) {
        return service.setDefault(context.userId(a), id);
    }

    @DeleteMapping("/{id}")
    public Map<String, Boolean> delete(Authentication a, @PathVariable Long id) {
        service.delete(context.userId(a), id);
        return Map.of("deleted", true);
    }
}
