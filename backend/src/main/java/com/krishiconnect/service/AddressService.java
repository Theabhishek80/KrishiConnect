package com.krishiconnect.service;

import com.krishiconnect.dto.AddressDtos.AddressRequest;
import com.krishiconnect.dto.AddressDtos.AddressView;
import com.krishiconnect.entity.Address;
import com.krishiconnect.repository.AddressRepository;
import com.krishiconnect.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Service
public class AddressService {

    private static final int MAX_ADDRESSES = 10;

    private final AddressRepository addresses;
    private final UserRepository users;

    public AddressService(AddressRepository addresses, UserRepository users) {
        this.addresses = addresses;
        this.users = users;
    }

    @Transactional(readOnly = true)
    public List<AddressView> list(Long userId) {
        return addresses.findByUserIdOrderByDefaultAddressDescIdDesc(userId)
                .stream()
                .map(AddressService::toView)
                .toList();
    }

    @Transactional
    public AddressView create(Long userId, AddressRequest request) {
        if (addresses.countByUserId(userId) >= MAX_ADDRESSES) {
            throw new IllegalArgumentException(
                    "You can save up to " + MAX_ADDRESSES + " addresses. Delete one to add another.");
        }

        Address address = new Address();
        address.setUser(users.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found")));
        apply(address, request);

        // The first address is always the default one.
        boolean first = addresses.countByUserId(userId) == 0;
        boolean makeDefault = first || Boolean.TRUE.equals(request.makeDefault());

        if (makeDefault) {
            clearDefault(userId);
        }

        address.setDefaultAddress(makeDefault);

        return toView(addresses.save(address));
    }

    @Transactional
    public AddressView update(Long userId, Long id, AddressRequest request) {
        Address address = find(userId, id);
        apply(address, request);

        if (Boolean.TRUE.equals(request.makeDefault()) && !address.isDefaultAddress()) {
            clearDefault(userId);
            address.setDefaultAddress(true);
        }

        return toView(addresses.save(address));
    }

    @Transactional
    public AddressView setDefault(Long userId, Long id) {
        Address address = find(userId, id);

        if (!address.isDefaultAddress()) {
            clearDefault(userId);
            address.setDefaultAddress(true);
            addresses.save(address);
        }

        return toView(address);
    }

    @Transactional
    public void delete(Long userId, Long id) {
        Address address = find(userId, id);
        boolean wasDefault = address.isDefaultAddress();

        addresses.delete(address);
        addresses.flush();

        // Deleting the default address promotes the newest remaining one.
        if (wasDefault) {
            addresses.findByUserIdOrderByDefaultAddressDescIdDesc(userId)
                    .stream()
                    .findFirst()
                    .ifPresent(next -> {
                        next.setDefaultAddress(true);
                        addresses.save(next);
                    });
        }
    }

    // ------------------------------------------------------------------

    private Address find(Long userId, Long id) {
        return addresses.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new NoSuchElementException("Address not found"));
    }

    private void clearDefault(Long userId) {
        for (Address a : addresses.findByUserIdOrderByDefaultAddressDescIdDesc(userId)) {
            if (a.isDefaultAddress()) {
                a.setDefaultAddress(false);
                addresses.save(a);
            }
        }
    }

    private static void apply(Address a, AddressRequest r) {
        a.setLabel(r.label().trim());
        a.setRecipientName(r.recipientName().trim());
        a.setPhone(r.phone().trim());
        a.setLine1(r.line1().trim());
        a.setLine2(r.line2() == null || r.line2().isBlank() ? null : r.line2().trim());
        a.setCity(r.city().trim());
        a.setState(r.state().trim());
        a.setPostalCode(r.postalCode().trim());
        a.setCountry("India");
    }

    private static AddressView toView(Address a) {
        return new AddressView(
                a.getId(),
                a.getLabel(),
                a.getRecipientName(),
                a.getPhone(),
                a.getLine1(),
                a.getLine2(),
                a.getCity(),
                a.getState(),
                a.getPostalCode(),
                a.getCountry(),
                a.isDefaultAddress()
        );
    }
}
