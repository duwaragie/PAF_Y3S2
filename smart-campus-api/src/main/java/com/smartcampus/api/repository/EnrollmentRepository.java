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

    Optional<Enrollment> findByStudentIdAndSectionId(Long studentId, Long sectionId);

    List<Enrollment> findByStudentId(Long studentId);

    List<Enrollment> findBySectionId(Long sectionId);

    List<Enrollment> findBySectionIdAndStatus(Long sectionId, EnrollmentStatus status);

    List<Enrollment> findByStudentIdAndStatus(Long studentId, EnrollmentStatus status);

    /** Whether the student already has a non-withdrawn enrollment in ANY section of this offering. */
    @Query("SELECT COUNT(e) > 0 FROM Enrollment e " +
           "WHERE e.student.id = :studentId " +
           "AND e.section.offering.id = :offeringId " +
           "AND e.status <> com.smartcampus.api.model.EnrollmentStatus.WITHDRAWN")
    boolean existsActiveInOffering(@Param("studentId") Long studentId,
                                   @Param("offeringId") Long offeringId);

    /**
     * Count enrollments that count against a section's capacity (ENROLLED + COMPLETED).
     * WAITLISTED and WITHDRAWN do not consume a seat.
     */
    @Query("SELECT COUNT(e) FROM Enrollment e " +
           "WHERE e.section.id = :sectionId " +
           "AND e.status IN (com.smartcampus.api.model.EnrollmentStatus.ENROLLED, " +
           "                 com.smartcampus.api.model.EnrollmentStatus.COMPLETED)")
    long countActiveBySectionId(@Param("sectionId") Long sectionId);

    /** Student's completed courses with released grades (used for GPA calculation). */
    @Query("SELECT e FROM Enrollment e " +
           "WHERE e.student.id = :studentId " +
           "AND e.status = com.smartcampus.api.model.EnrollmentStatus.COMPLETED " +
           "AND e.gradeReleased = true")
    List<Enrollment> findCompletedWithReleasedGrades(@Param("studentId") Long studentId);

    /** All active enrollments (ENROLLED or COMPLETED) across any section a given lecturer owns. */
    @Query("SELECT e FROM Enrollment e " +
           "WHERE e.section.lecturer.id = :lecturerId " +
           "AND e.status IN (com.smartcampus.api.model.EnrollmentStatus.ENROLLED, " +
           "                 com.smartcampus.api.model.EnrollmentStatus.COMPLETED)")
    List<Enrollment> findForLecturer(@Param("lecturerId") Long lecturerId);

    /** Enrollments within a specific offering (spans all sections). Used for offering-wide release. */
    @Query("SELECT e FROM Enrollment e WHERE e.section.offering.id = :offeringId")
    List<Enrollment> findByOfferingId(@Param("offeringId") Long offeringId);
}
