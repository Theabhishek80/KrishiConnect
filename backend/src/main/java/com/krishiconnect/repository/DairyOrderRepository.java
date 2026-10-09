package com.krishiconnect.repository;

import com.krishiconnect.entity.DairyOrder;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DairyOrderRepository extends JpaRepository<DairyOrder, Long> {

    @EntityGraph(attributePaths = {"store", "consumer"})
    List<DairyOrder> findByConsumer_IdOrderByCreatedAtDesc(Long consumerId);

    @EntityGraph(attributePaths = {"store", "consumer"})
    List<DairyOrder> findByStore_IdOrderByCreatedAtDesc(Long storeId);
}
