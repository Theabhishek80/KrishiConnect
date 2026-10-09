package com.krishiconnect.repository;

import com.krishiconnect.entity.DairyStoreReview;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface DairyStoreReviewRepository extends JpaRepository<DairyStoreReview, Long> {

    @EntityGraph(attributePaths = {"user"})
    List<DairyStoreReview> findByStore_IdOrderByCreatedAtDesc(Long storeId);

    Optional<DairyStoreReview> findByStore_IdAndUser_Id(Long storeId, Long userId);

    // [storeId, avgRating, count]
    @Query("SELECT r.store.id, AVG(r.rating), COUNT(r) FROM DairyStoreReview r GROUP BY r.store.id")
    List<Object[]> aggregateAll();

    @Query("SELECT r.store.id, AVG(r.rating), COUNT(r) FROM DairyStoreReview r WHERE r.store.id = ?1 GROUP BY r.store.id")
    List<Object[]> aggregateForStore(Long storeId);
}
