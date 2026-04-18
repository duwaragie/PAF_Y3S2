package com.smartcampus.api.repository;

import com.smartcampus.api.model.CourseSection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseSectionRepository extends JpaRepository<CourseSection, Long> {

    List<CourseSection> findByOfferingId(Long offeringId);

    List<CourseSection> findByLecturerId(Long lecturerId);

    Optional<CourseSection> findByOfferingIdAndLabel(Long offeringId, String label);

    /** Has the given user been assigned as lecturer to any section of this offering? */
    @Query("SELECT COUNT(s) > 0 FROM CourseSection s " +
           "WHERE s.offering.id = :offeringId AND s.lecturer.id = :userId")
    boolean isLecturerOnOffering(@Param("offeringId") Long offeringId,
                                 @Param("userId") Long userId);
}
