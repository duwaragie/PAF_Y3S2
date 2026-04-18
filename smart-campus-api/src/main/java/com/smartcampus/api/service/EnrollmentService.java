package com.smartcampus.api.service;

import com.smartcampus.api.dto.EnrollmentDTO;
import com.smartcampus.api.dto.TranscriptDTO;
import com.smartcampus.api.exception.BadRequestException;
import com.smartcampus.api.exception.ResourceNotFoundException;
import com.smartcampus.api.exception.UserNotFoundException;
import com.smartcampus.api.model.*;
import com.smartcampus.api.repository.CourseOfferingRepository;
import com.smartcampus.api.repository.EnrollmentRepository;
import com.smartcampus.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final CourseOfferingRepository courseOfferingRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    /**
     * Student self-enrolls in an open course offering.
     * Performs: offering status check, duplicate check, prerequisites check, capacity vs waitlist.
     */
    @Transactional
    public EnrollmentDTO enroll(Long studentId, Long offeringId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new UserNotFoundException(studentId));
        if (student.getRole() != Role.STUDENT) {
            throw new BadRequestException("Only students can self-enroll.");
        }

        CourseOffering offering = courseOfferingRepository.findById(offeringId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Course offering " + offeringId + " not found"));

        if (offering.getStatus() != CourseOfferingStatus.OPEN) {
            throw new BadRequestException("Enrollment for this course is not open.");
        }

        enrollmentRepository.findByStudentIdAndOfferingId(studentId, offeringId)
                .ifPresent(existing -> {
                    if (existing.getStatus() != EnrollmentStatus.WITHDRAWN) {
                        throw new BadRequestException(
                                "You are already enrolled in this course.");
                    }
                });

        // Prerequisite check: every prereq code must exist as a COMPLETED enrollment
        // with a passing released grade (>= D, i.e. not F and not I/W).
        List<String> missingPrereqs = missingPrerequisitesFor(student.getId(), offering.getPrerequisites());
        if (!missingPrereqs.isEmpty()) {
            throw new BadRequestException(
                    "Missing prerequisites: " + String.join(", ", missingPrereqs));
        }

        long active = enrollmentRepository.countActiveByOfferingId(offeringId);
        EnrollmentStatus status = active < offering.getCapacity()
                ? EnrollmentStatus.ENROLLED
                : EnrollmentStatus.WAITLISTED;

        // Re-use withdrawn record if present (unique constraint on student+offering)
        Enrollment enrollment = enrollmentRepository
                .findByStudentIdAndOfferingId(studentId, offeringId)
                .map(existing -> {
                    existing.setStatus(status);
                    existing.setWithdrawnAt(null);
                    return existing;
                })
                .orElseGet(() -> Enrollment.builder()
                        .student(student)
                        .offering(offering)
                        .status(status)
                        .gradeReleased(false)
                        .build());

        enrollment = enrollmentRepository.save(enrollment);

        if (status == EnrollmentStatus.ENROLLED) {
            notificationService.notify(student,
                    NotificationType.ENROLLMENT_CONFIRMED,
                    NotificationPriority.MEDIUM,
                    "Enrollment confirmed: " + offering.getCode(),
                    "You're enrolled in " + offering.getTitle()
                            + " (" + offering.getCredits() + " credits) for " + offering.getSemester() + ".",
                    "/enrollments");
        } else {
            notificationService.notify(student,
                    NotificationType.ENROLLMENT_WAITLISTED,
                    NotificationPriority.MEDIUM,
                    "Waitlisted: " + offering.getCode(),
                    "The class is full. You're on the waitlist for " + offering.getTitle()
                            + ". We'll notify you if a seat opens up.",
                    "/enrollments");
        }

        return toDTO(enrollment);
    }

    /**
     * Student withdraws. If they held an active seat, promote the oldest WAITLISTED student.
     */
    @Transactional
    public EnrollmentDTO withdraw(Long studentId, Long enrollmentId) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Enrollment " + enrollmentId + " not found"));

        if (!enrollment.getStudent().getId().equals(studentId)) {
            throw new BadRequestException("You can only withdraw your own enrollments.");
        }

        if (enrollment.getStatus() == EnrollmentStatus.WITHDRAWN
                || enrollment.getStatus() == EnrollmentStatus.COMPLETED) {
            throw new BadRequestException("This enrollment cannot be withdrawn.");
        }

        boolean heldActiveSeat = enrollment.getStatus() == EnrollmentStatus.ENROLLED;
        enrollment.setStatus(EnrollmentStatus.WITHDRAWN);
        enrollment.setWithdrawnAt(LocalDateTime.now());
        enrollment = enrollmentRepository.save(enrollment);

        notificationService.notify(enrollment.getStudent(),
                NotificationType.ENROLLMENT_WITHDRAWN,
                NotificationPriority.LOW,
                "Withdrawal confirmed: " + enrollment.getOffering().getCode(),
                "You've withdrawn from " + enrollment.getOffering().getTitle() + ".",
                "/enrollments");

        if (heldActiveSeat) {
            promoteWaitlist(enrollment.getOffering());
        }

        return toDTO(enrollment);
    }

    /** Promote the oldest waitlisted student in a course to ENROLLED. Called after a seat opens. */
    private void promoteWaitlist(CourseOffering offering) {
        List<Enrollment> waitlist = enrollmentRepository
                .findByOfferingIdAndStatus(offering.getId(), EnrollmentStatus.WAITLISTED);
        if (waitlist.isEmpty()) return;

        waitlist.sort(Comparator.comparing(Enrollment::getEnrolledAt));
        Enrollment promoted = waitlist.get(0);
        promoted.setStatus(EnrollmentStatus.ENROLLED);
        enrollmentRepository.save(promoted);

        notificationService.notify(promoted.getStudent(),
                NotificationType.WAITLIST_PROMOTED,
                NotificationPriority.HIGH,
                "Seat available: " + offering.getCode(),
                "Good news, a seat opened up in " + offering.getTitle()
                        + " and you've been moved off the waitlist.",
                "/enrollments");
    }

    public List<EnrollmentDTO> listMine(Long studentId) {
        return enrollmentRepository.findByStudentId(studentId).stream()
                .sorted(Comparator.comparing(Enrollment::getEnrolledAt).reversed())
                .map(this::toDTO)
                .toList();
    }

    public List<EnrollmentDTO> listByCourse(Long offeringId) {
        return enrollmentRepository.findByOfferingId(offeringId).stream()
                .sorted(Comparator.comparing(Enrollment::getEnrolledAt))
                .map(this::toDTO)
                .toList();
    }

    /** Lecturer / admin sets a grade on an enrollment (does NOT auto-release). */
    @Transactional
    public EnrollmentDTO setGrade(Long enrollmentId, Grade grade) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Enrollment " + enrollmentId + " not found"));

        if (enrollment.getStatus() == EnrollmentStatus.WITHDRAWN) {
            throw new BadRequestException("Cannot grade a withdrawn enrollment.");
        }

        enrollment.setGrade(grade);
        // Setting a grade on its own doesn't release it or complete the course.
        return toDTO(enrollmentRepository.save(enrollment));
    }

    /**
     * Bulk-release all grades for a course offering. Marks enrollments COMPLETED, grade released,
     * and fires a HIGH priority notification to each student.
     */
    @Transactional
    public int releaseGradesForOffering(Long offeringId) {
        CourseOffering offering = courseOfferingRepository.findById(offeringId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Course offering " + offeringId + " not found"));

        List<Enrollment> enrollments = enrollmentRepository.findByOfferingId(offeringId).stream()
                .filter(e -> e.getStatus() == EnrollmentStatus.ENROLLED && e.getGrade() != null)
                .filter(e -> !Boolean.TRUE.equals(e.getGradeReleased()))
                .toList();

        if (enrollments.isEmpty()) {
            throw new BadRequestException(
                    "No graded enrollments to release. Grade students first, then release.");
        }

        LocalDateTime now = LocalDateTime.now();
        int count = 0;
        for (Enrollment e : enrollments) {
            e.setStatus(EnrollmentStatus.COMPLETED);
            e.setGradeReleased(true);
            e.setGradeReleasedAt(now);
            enrollmentRepository.save(e);

            notificationService.notify(e.getStudent(),
                    NotificationType.GRADE_RELEASED,
                    NotificationPriority.HIGH,
                    "Grade released: " + offering.getCode(),
                    "Your grade for " + offering.getTitle()
                            + " is now available in your transcript.",
                    "/transcript");
            count++;
        }
        return count;
    }

    public TranscriptDTO transcript(Long studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new UserNotFoundException(studentId));

        List<Enrollment> all = enrollmentRepository.findByStudentId(studentId);
        all.sort(Comparator.comparing(Enrollment::getEnrolledAt).reversed());

        List<Enrollment> gpaEligible = all.stream()
                .filter(e -> e.getStatus() == EnrollmentStatus.COMPLETED)
                .filter(e -> Boolean.TRUE.equals(e.getGradeReleased()))
                .filter(e -> e.getGrade() != null && e.getGrade().isCountsForGpa())
                .toList();

        double totalPoints = 0.0;
        double totalCredits = 0.0;
        for (Enrollment e : gpaEligible) {
            double credits = e.getOffering().getCredits() != null ? e.getOffering().getCredits() : 0.0;
            Double points = e.getGrade().getGpaPoints();
            if (points == null) continue;
            totalPoints += points * credits;
            totalCredits += credits;
        }
        double gpa = totalCredits > 0 ? round2(totalPoints / totalCredits) : 0.0;

        return TranscriptDTO.builder()
                .studentId(student.getId())
                .studentName(student.getName())
                .studentRegistrationNumber(student.getStudentRegistrationNumber())
                .gpa(gpa)
                .creditsEarned(round2(totalCredits))
                .coursesCompleted(gpaEligible.size())
                .entries(all.stream().map(this::toDTO).toList())
                .build();
    }

    private List<String> missingPrerequisitesFor(Long studentId, String prerequisites) {
        if (prerequisites == null || prerequisites.isBlank()) return List.of();

        Set<String> required = Arrays.stream(prerequisites.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toCollection(LinkedHashSet::new));

        if (required.isEmpty()) return List.of();

        Set<String> passed = enrollmentRepository.findCompletedWithReleasedGrades(studentId).stream()
                .filter(e -> e.getGrade() != null && e.getGrade() != Grade.F
                        && e.getGrade() != Grade.I && e.getGrade() != Grade.W)
                .map(e -> e.getOffering().getCode())
                .collect(Collectors.toSet());

        return required.stream()
                .filter(code -> !passed.contains(code))
                .toList();
    }

    private EnrollmentDTO toDTO(Enrollment e) {
        return EnrollmentDTO.builder()
                .id(e.getId())
                .studentId(e.getStudent().getId())
                .studentName(e.getStudent().getName())
                .studentEmail(e.getStudent().getEmail())
                .studentRegistrationNumber(e.getStudent().getStudentRegistrationNumber())
                .offeringId(e.getOffering().getId())
                .courseCode(e.getOffering().getCode())
                .courseTitle(e.getOffering().getTitle())
                .semester(e.getOffering().getSemester())
                .credits(e.getOffering().getCredits())
                .status(e.getStatus())
                .grade(e.getGrade())
                .gradeLabel(e.getGrade() != null ? e.getGrade().getLabel() : null)
                .gradePoints(e.getGrade() != null ? e.getGrade().getGpaPoints() : null)
                .gradeReleased(e.getGradeReleased())
                .gradeReleasedAt(e.getGradeReleasedAt())
                .enrolledAt(e.getEnrolledAt())
                .withdrawnAt(e.getWithdrawnAt())
                .build();
    }

    private double round2(double d) {
        return Math.round(d * 100.0) / 100.0;
    }
}
