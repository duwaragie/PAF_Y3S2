package com.smartcampus.api.repository;

import com.smartcampus.api.model.Resource;
import com.smartcampus.api.model.ResourceStatus;
import com.smartcampus.api.model.ResourceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResourceRepository extends JpaRepository<Resource, Long> {

    @Query("SELECT r FROM Resource r " +
           "LEFT JOIN r.assets a " +
           "LEFT JOIN r.amenities am " +
           "WHERE (:type IS NULL OR r.type = :type) " +
           "AND (:status IS NULL OR r.status = :status) " +
           "AND (:locationId IS NULL OR r.location.id = :locationId) " +
           "AND (:minCapacity IS NULL OR r.capacity >= :minCapacity) " +
           "AND (:assetIds IS NULL OR a.id IN :assetIds) " +
           "AND (:amenityIds IS NULL OR am.id IN :amenityIds) " +
           "GROUP BY r.id " +
           "HAVING (:assetIds IS NULL OR COUNT(DISTINCT a.id) = :assetIdCount) " +
           "AND (:amenityIds IS NULL OR COUNT(DISTINCT am.id) = :amenityIdCount)")
    List<Resource> searchResources(
            @Param("type") ResourceType type,
            @Param("status") ResourceStatus status,
            @Param("locationId") Long locationId,
            @Param("minCapacity") Integer minCapacity,
            @Param("assetIds") List<Long> assetIds,
            @Param("assetIdCount") Long assetIdCount,
            @Param("amenityIds") List<Long> amenityIds,
            @Param("amenityIdCount") Long amenityIdCount);
}
