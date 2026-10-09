package com.krishiconnect.repository;

import com.krishiconnect.entity.DairySubscription;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DairySubscriptionRepository extends JpaRepository<DairySubscription, Long> {

    @EntityGraph(attributePaths = {"store", "consumer"})
    List<DairySubscription> findByConsumer_IdOrderByCreatedAtDesc(Long consumerId);

    @EntityGraph(attributePaths = {"store", "consumer"})
    List<DairySubscription> findByStore_IdOrderByCreatedAtDesc(Long storeId);
}
