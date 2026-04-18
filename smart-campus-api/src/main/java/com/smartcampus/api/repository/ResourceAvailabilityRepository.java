package com.smartcampus.api.repository;

import com.smartcampus.api.model.ResourceAvailability;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResourceAvailabilityRepository extends JpaRepository<ResourceAvailability, Long> {
    List<ResourceAvailability> findByResourceId(Long resourceId);
    void deleteByResourceId(Long resourceId);
}
