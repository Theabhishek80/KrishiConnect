package com.krishiconnect.repository;

import com.krishiconnect.entity.DairyProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface DairyProductRepository extends JpaRepository<DairyProduct, Long> {

    List<DairyProduct> findByStore_IdOrderByCreatedAtDesc(Long storeId);

    List<DairyProduct> findByStore_IdAndAvailableTrueOrderByCategoryAscNameAsc(Long storeId);

    long countByStore_IdAndAvailableTrue(Long storeId);

    @Query("SELECT p.store.id, COUNT(p) FROM DairyProduct p WHERE p.available = true GROUP BY p.store.id")
    List<Object[]> countAvailableByStore();

    // Atomic stock decrement: returns 0 when there is not enough stock.
    @Modifying(flushAutomatically = true)
    @Query("UPDATE DairyProduct p SET p.stockQuantity = p.stockQuantity - :qty "
            + "WHERE p.id = :id AND p.stockQuantity >= :qty")
    int decrementStock(@Param("id") Long id, @Param("qty") BigDecimal qty);

    @Modifying(flushAutomatically = true)
    @Query("UPDATE DairyProduct p SET p.stockQuantity = p.stockQuantity + :qty WHERE p.id = :id")
    int incrementStock(@Param("id") Long id, @Param("qty") BigDecimal qty);
}
