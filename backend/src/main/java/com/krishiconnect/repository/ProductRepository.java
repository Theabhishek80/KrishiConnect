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

    @EntityGraph(attributePaths = {"images"})
    Page<Product> findByStatus(
            ProductStatus status,
            Pageable pageable
    );

    @EntityGraph(attributePaths = {"images"})
    Page<Product> findByStatusAndNameContainingIgnoreCase(
            ProductStatus status,
            String name,
            Pageable pageable
    );

    // ============================================================
    // FARMER PRODUCTS
    // ============================================================

    @EntityGraph(attributePaths = {"images"})
    Page<Product> findByFarmerId(
            Long farmerId,
            Pageable pageable
    );

    @EntityGraph(attributePaths = {"images"})
    List<Product> findByFarmerId(
            Long farmerId
    );

    // ============================================================
    // ADMIN - ALL PRODUCTS
    // ============================================================

    @EntityGraph(attributePaths = {"images"})
    List<Product> findAllByOrderByCreatedAtDesc();

    // ============================================================
    // ADMIN - STATUS
    // ============================================================

    @EntityGraph(attributePaths = {"images"})
    Page<Product> findByStatusOrderByCreatedAtDesc(
            ProductStatus status,
            Pageable pageable
    );

    @EntityGraph(attributePaths = {"images"})
    List<Product> findByStatusOrderByCreatedAtDesc(
            ProductStatus status
    );

    // ============================================================
    // FARMER + STATUS
    // ============================================================

    @EntityGraph(attributePaths = {"images"})
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
