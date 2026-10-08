package com.krishiconnect.repository;

import com.krishiconnect.domain.ProductStatus;
import com.krishiconnect.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    // ============================================================
    // PUBLIC MARKETPLACE
    // ============================================================

    @EntityGraph(attributePaths = {
            "category",
            "farmer",
            "images"
    })
    Page<Product> findByStatus(
            ProductStatus status,
            Pageable pageable
    );

    @EntityGraph(attributePaths = {
            "category",
            "farmer",
            "images"
    })
    Page<Product> findByStatusAndNameContainingIgnoreCase(
            ProductStatus status,
            String name,
            Pageable pageable
    );

    // ============================================================
    // FARMER PRODUCTS
    // ============================================================

    @EntityGraph(attributePaths = {
            "category",
            "farmer",
            "images"
    })
    Page<Product> findByFarmerId(
            Long farmerId,
            Pageable pageable
    );

    @EntityGraph(attributePaths = {
            "category",
            "farmer",
            "images"
    })
    List<Product> findByFarmerId(
            Long farmerId
    );

    // ============================================================
    // ADMIN
    // ============================================================

    @EntityGraph(attributePaths = {
            "category",
            "farmer",
            "images"
    })
    List<Product> findByStatusOrderByCreatedAtDesc(
            ProductStatus status
    );

    @EntityGraph(attributePaths = {
            "category",
            "farmer",
            "images"
    })
    Page<Product> findByStatusOrderByCreatedAtDesc(
            ProductStatus status,
            Pageable pageable
    );

    // ============================================================
    // FARMER + STATUS
    // ============================================================

    @EntityGraph(attributePaths = {
            "category",
            "farmer",
            "images"
    })
    Page<Product> findByFarmerIdAndStatus(
            Long farmerId,
            ProductStatus status,
            Pageable pageable
    );

    // ============================================================
    // COUNTS
    // ============================================================

    long countByStatus(
            ProductStatus status
    );

    long countByFarmerIdAndStatus(
            Long farmerId,
            ProductStatus status
    );
}
