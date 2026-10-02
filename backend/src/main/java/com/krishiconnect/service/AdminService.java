package com.krishiconnect.service;

import com.krishiconnect.domain.ProductStatus;
import com.krishiconnect.repository.OrderRepository;
import com.krishiconnect.repository.ProductRepository;
import com.krishiconnect.repository.UserRepository;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
public class AdminService {

    private final UserRepository users;
    private final ProductRepository products;
    private final OrderRepository orders;

    public AdminService(
            UserRepository users,
            ProductRepository products,
            OrderRepository orders
    ) {
        this.users = users;
        this.products = products;
        this.orders = orders;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> dashboard() {
        return Map.of(
                "users", users.count(),
                "products", products.count(),
                "pendingProducts",
                products.findByStatus(
                        ProductStatus.PENDING_APPROVAL,
                        PageRequest.of(0, 1)
                ).getTotalElements(),
                "orders", orders.count()
        );
    }

    @Transactional(readOnly = true)
    public Object getAllProducts() {
        return products.findAllWithDetails();
    }

    @Transactional(readOnly = true)
    public Object getPendingProducts() {
        return products.findByStatus(
                ProductStatus.PENDING_APPROVAL,
                PageRequest.of(0, 100)
        );
    }

    @Transactional
    public Object approveProduct(Long id) {
        var product = products.findById(id)
                .orElseThrow();

        product.setStatus(ProductStatus.APPROVED);

        return products.save(product);
    }

    @Transactional
    public Object rejectProduct(Long id) {
        var product = products.findById(id)
                .orElseThrow();

        product.setStatus(ProductStatus.REJECTED);

        return products.save(product);
    }

    @Transactional
    public void deleteProduct(Long id) {
        products.deleteById(id);
    }
}

@Transactional(readOnly = true)
public Object getAllUsers() {
    return users.findAll();
}
@Transactional(readOnly = true)
public Object getAllUsers() {
    return users.findAll();
}

@Transactional(readOnly = true)
public Object getAllOrders() {
    return orders.findAll();
}
