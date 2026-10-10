package com.krishiconnect.repository;

import com.krishiconnect.entity.Blog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BlogRepository extends JpaRepository<Blog, Long> {

    List<Blog> findByPublishedTrueOrderBySortOrderAscIdDesc();

    List<Blog> findAllByOrderBySortOrderAscIdDesc();

    Optional<Blog> findBySlugAndPublishedTrue(String slug);

    boolean existsBySlug(String slug);
}
