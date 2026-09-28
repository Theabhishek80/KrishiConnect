package com.krishiconnect.repository;

import com.krishiconnect.entity.Product;
import com.krishiconnect.domain.ProductStatus;

import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {

    @EntityGraph(attributePaths = {"category", "farmer", "images"})
    Page<Product> findByStatus(
            ProductStatus status,
            Pageable pageable
    );

    @EntityGraph(attributePaths = {"category", "farmer", "images"})
    Page<Product> findByStatusAndNameContainingIgnoreCase(
            ProductStatus status,
            String name,
            Pageable pageable
    );

    Page<Product> findByFarmerId(
            Long farmerId,
            Pageable pageable
    );

    // ADMIN - GET ALL PRODUCTS WITH DETAILS
    @EntityGraph(attributePaths = {"category", "farmer", "images"})
    List<Product> findAllWithDetails();
}
