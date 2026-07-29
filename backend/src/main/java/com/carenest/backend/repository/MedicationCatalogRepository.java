package com.carenest.backend.repository;

import com.carenest.backend.entity.MedicationCatalogItem;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MedicationCatalogRepository extends JpaRepository<MedicationCatalogItem, Long> {

    @Query("SELECT c FROM MedicationCatalogItem c "
        + "WHERE LOWER(c.name) LIKE LOWER(CONCAT('%', :q, '%')) "
        + "OR LOWER(c.brandNames) LIKE LOWER(CONCAT('%', :q, '%')) "
        + "ORDER BY c.name ASC")
    List<MedicationCatalogItem> search(@Param("q") String query, Pageable pageable);

    List<MedicationCatalogItem> findByCategoryOrderByNameAsc(String category);
}
