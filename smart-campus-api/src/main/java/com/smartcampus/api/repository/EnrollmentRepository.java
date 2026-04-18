package com.smartcampus.api.repository;

import com.smartcampus.api.model.Enrollment;
import com.smartcampus.api.model.EnrollmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {

    Optional<Enrollment> findByStudentIdAndOfferingId(Long studentId, Long offeringId);

    List<Enrollment> findByStudentId(Long studentId);

    List<Enrollment> findByOfferingId(Long offeringId);

    List<Enrollment> findByStudentIdAndStatus(Long studentId, EnrollmentStatus status);

    List<Enrollment> findByOfferingIdAndStatus(Long offeringId, EnrollmentStatus status);

    /**
     * Count enrollments that count against capacity (ENROLLED + COMPLETED).
     * WAITLISTED and WITHDRAWN do not consume a seat.
     */
    @Query("SELECT COUNT(e) FROM Enrollment e " +
           "WHERE e.offering.id = :offeringId " +
           "AND e.status IN (com.smartcampus.api.model.EnrollmentStatus.ENROLLED, " +
           "                 com.smartcampus.api.model.EnrollmentStatus.COMPLETED)")
    long countActiveByOfferingId(@Param("offeringId") Long offeringId);

    /** Student's completed courses with released grades (used for GPA calculation). */
    @Query("SELECT e FROM Enrollment e " +
           "WHERE e.student.id = :studentId " +
           "AND e.status = com.smartcampus.api.model.EnrollmentStatus.COMPLETED " +
           "AND e.gradeReleased = true")
    List<Enrollment> findCompletedWithReleasedGrades(@Param("studentId") Long studentId);
}
