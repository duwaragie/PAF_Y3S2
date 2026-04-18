package com.smartcampus.api.repository;

import com.smartcampus.api.model.CourseOffering;
import com.smartcampus.api.model.CourseOfferingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseOfferingRepository extends JpaRepository<CourseOffering, Long> {
    Optional<CourseOffering> findByCodeAndSemester(String code, String semester);
    List<CourseOffering> findBySemester(String semester);
    List<CourseOffering> findByStatus(CourseOfferingStatus status);
    List<CourseOffering> findBySemesterAndStatus(String semester, CourseOfferingStatus status);
}
