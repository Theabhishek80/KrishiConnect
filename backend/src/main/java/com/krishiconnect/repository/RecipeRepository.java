package com.krishiconnect.repository;

import com.krishiconnect.entity.Recipe;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RecipeRepository extends JpaRepository<Recipe, Long> {

    List<Recipe> findByPublishedTrueOrderBySortOrderAscIdDesc();

    List<Recipe> findAllByOrderBySortOrderAscIdDesc();

    Optional<Recipe> findBySlugAndPublishedTrue(String slug);

    boolean existsBySlug(String slug);
}
