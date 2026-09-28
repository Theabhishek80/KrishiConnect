package com.krishiconnect.repository;
import com.krishiconnect.entity.Product;
import com.krishiconnect.domain.ProductStatus;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;
public interface ProductRepository extends JpaRepository<Product,Long> {
 Page<Product> findByStatus(ProductStatus status, Pageable pageable);
 Page<Product> findByStatusAndNameContainingIgnoreCase(ProductStatus status,String name,Pageable pageable);
 Page<Product> findByFarmerId(Long farmerId,Pageable pageable);
}