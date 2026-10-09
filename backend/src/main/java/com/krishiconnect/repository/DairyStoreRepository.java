
package com.krishiconnect.repository;

import com.krishiconnect.entity.DairyStore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface DairyStoreRepository
        extends JpaRepository<DairyStore, Long> {

    List<DairyStore> findByActiveTrueOrderByStoreNameAsc();

    List<DairyStore> findByOwner_IdOrderByCreatedAtDesc(Long ownerId);

    Optional<DairyStore> findByIdAndActiveTrue(Long id);

    @Query("""
        SELECT s
        FROM DairyStore s
        WHERE s.active = true
          AND LOWER(s.city) = LOWER(:city)
          AND LOWER(s.state) = LOWER(:state)
        ORDER BY s.storeName ASC
        """)
    List<DairyStore> findActiveStoresByCityAndState(
            @Param("city") String city,
            @Param("state") String state
    );

    @Query("""
        SELECT s
        FROM DairyStore s
        WHERE s.active = true
          AND s.postalCode = :postalCode
        ORDER BY s.storeName ASC
        """)
    List<DairyStore> findActiveStoresByPostalCode(
            @Param("postalCode") String postalCode
    );
}
