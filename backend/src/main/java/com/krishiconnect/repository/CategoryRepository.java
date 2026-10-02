package com.krishiconnect.repository;
import com.krishiconnect.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
public interface CategoryRepository extends JpaRepository<Category,Long> { }