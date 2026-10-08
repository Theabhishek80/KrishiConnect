package com.krishiconnect.repository;

import com.krishiconnect.domain.ProductStatus;
import com.krishiconnect.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    // ============================================================
    // PUBLIC MARKETPLACE
    // ============================================================

    Page<Product> findByStatus(
            ProductStatus status,
            Pageable pageable
    );

    Page<Product> findByStatusAndNameContainingIgnoreCase(
            ProductStatus status,
            String name,
            Pageable pageable
    );

    // ============================================================
    // FARMER PRODUCTS
    // ============================================================

    Page<Product> findByFarmerId(
            Long farmerId,
            Pageable pageable
    );

    List<Product> findByFarmerId(
            Long farmerId
    );

    // ============================================================
    // ADMIN
    // ============================================================

    Page<Product> findByStatusOrderByCreatedAtDesc(
            ProductStatus status,
            Pageable pageable
    );

    List<Product> findByStatusOrderByCreatedAtDesc(
            ProductStatus status
    );

    long countByStatus(
            ProductStatus status
    );

    // ============================================================
    // FARMER + STATUS
    // ============================================================

    Page<Product> findByFarmerIdAndStatus(
            Long farmerId,
            ProductStatus status,
            Pageable pageable
    );

    long countByFarmerIdAndStatus(
            Long farmerId,
            ProductStatus status
    );
}
