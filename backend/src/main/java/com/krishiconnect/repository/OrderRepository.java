package com.krishiconnect.repository;
import com.krishiconnect.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface OrderRepository extends JpaRepository<Order,Long> { List<Order> findByConsumerIdOrderByCreatedAtDesc(Long id); List<Order> findByFarmerIdOrderByCreatedAtDesc(Long id); }