package com.smartcampus.api.service;

import com.smartcampus.api.dto.EnrollmentDTO;
import com.smartcampus.api.dto.TranscriptDTO;
import com.smartcampus.api.exception.BadRequestException;
import com.smartcampus.api.exception.ResourceNotFoundException;
import com.smartcampus.api.exception.UserNotFoundException;
import com.smartcampus.api.model.*;
import com.smartcampus.api.repository.CourseOfferingRepository;
import com.smartcampus.api.repository.CourseSectionRepository;
import com.smartcampus.api.repository.EnrollmentRepository;
import com.smartcampus.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final CourseSectionRepository courseSectionRepository;
    private final CourseOfferingRepository courseOfferingRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    /**
     * Student self-enrolls in a specific section.
     * Checks: section exists, offering is OPEN, no duplicate across offering, prerequisites met,
     * capacity on this section (else waitlist on this section).
     */
    @Transactional
    public EnrollmentDTO enroll(Long studentId, Long sectionId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new UserNotFoundException(studentId));
        if (student.getRole() != Role.STUDENT) {
            throw new BadRequestException("Only students can self-enroll.");
        }

        CourseSection section = courseSectionRepository.findById(sectionId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Section " + sectionId + " not found"));

        CourseOffering offering = section.getOffering();
        if (offering.getStatus() != CourseOfferingStatus.OPEN) {
            throw new BadRequestException("Enrollment for this course is not open.");
        }

        // Block duplicate enrollment in this section (unless previously withdrawn and we're re-enrolling)
        enrollmentRepository.findByStudentIdAndSectionId(studentId, sectionId)
                .ifPresent(existing -> {
                    if (existing.getStatus() != EnrollmentStatus.WITHDRAWN) {
                        throw new BadRequestException(
                                "You are already enrolled in this section.");
                    }
                });
        // Block being active in a *different* section of the same offering
        if (enrollmentRepository.existsActiveInOffering(studentId, offering.getId())) {
            throw new BadRequestException(
                    "You are already enrolled in another section of " + offering.getCode() + ".");
        }

        // Prerequisite check
        List<String> missing = missingPrerequisitesFor(studentId, offering.getPrerequisites());
        if (!missing.isEmpty()) {
            throw new BadRequestException(
                    "Missing prerequisites: " + String.join(", ", missing));
        }

        long active = enrollmentRepository.countActiveBySectionId(sectionId);
        EnrollmentStatus status = active < section.getCapacity()
                ? EnrollmentStatus.ENROLLED
                : EnrollmentStatus.WAITLISTED;

        // Re-use existing (possibly withdrawn) row for the unique constraint
        Enrollment enrollment = enrollmentRepository
                .findByStudentIdAndSectionId(studentId, sectionId)
                .map(existing -> {
                    existing.setStatus(status);
                    existing.setWithdrawnAt(null);
                    return existing;
                })
                .orElseGet(() -> Enrollment.builder()
                        .student(student)
                        .section(section)
                        .status(status)
                        .gradeReleased(false)
                        .build());

        enrollment = enrollmentRepository.save(enrollment);

        String sectionLabel = section.getLabel();
        String lecturerBlurb = section.getLecturer() != null
                ? " with " + section.getLecturer().getName()
                : "";

        if (status == EnrollmentStatus.ENROLLED) {
            notificationService.notify(student,
                    NotificationType.ENROLLMENT_CONFIRMED,
                    NotificationPriority.MEDIUM,
                    "Enrollment confirmed: " + offering.getCode() + " / " + sectionLabel,
                    "You're enrolled in " + offering.getTitle() + " (" + sectionLabel + ")"
                            + lecturerBlurb + " for " + offering.getSemester() + ".",
                    "/enrollments");
        } else {
            notificationService.notify(student,
                    NotificationType.ENROLLMENT_WAITLISTED,
                    NotificationPriority.MEDIUM,
                    "Waitlisted: " + offering.getCode() + " / " + sectionLabel,
                    "The section is full. You're on the waitlist for " + offering.getTitle()
                            + " (" + sectionLabel + "). We'll notify you if a seat opens up.",
                    "/enrollments");
        }

        return toDTO(enrollment);
    }

    /**
     * Student withdraws. If they held an active seat, promote the oldest WAITLISTED student
     * in the SAME section.
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

        CourseSection section = enrollment.getSection();
        CourseOffering offering = section.getOffering();

        notificationService.notify(enrollment.getStudent(),
                NotificationType.ENROLLMENT_WITHDRAWN,
                NotificationPriority.LOW,
                "Withdrawal confirmed: " + offering.getCode() + " / " + section.getLabel(),
                "You've withdrawn from " + offering.getTitle() + " (" + section.getLabel() + ").",
                "/enrollments");

        if (heldActiveSeat) {
            promoteWaitlist(section);
        }

        return toDTO(enrollment);
    }

    /** Promote the oldest waitlisted student in a section to ENROLLED. */
    private void promoteWaitlist(CourseSection section) {
        List<Enrollment> waitlist = enrollmentRepository
                .findBySectionIdAndStatus(section.getId(), EnrollmentStatus.WAITLISTED);
        if (waitlist.isEmpty()) return;

        waitlist.sort(Comparator.comparing(Enrollment::getEnrolledAt));
        Enrollment promoted = waitlist.get(0);
        promoted.setStatus(EnrollmentStatus.ENROLLED);
        enrollmentRepository.save(promoted);

        CourseOffering offering = section.getOffering();
        notificationService.notify(promoted.getStudent(),
                NotificationType.WAITLIST_PROMOTED,
                NotificationPriority.HIGH,
                "Seat available: " + offering.getCode() + " / " + section.getLabel(),
                "Good news, a seat opened up in " + offering.getTitle()
                        + " (" + section.getLabel() + ") and you've been moved off the waitlist.",
                "/enrollments");
    }

    public List<EnrollmentDTO> listMine(Long studentId) {
        return enrollmentRepository.findByStudentId(studentId).stream()
                .sorted(Comparator.comparing(Enrollment::getEnrolledAt).reversed())
                .map(this::toDTO)
                .toList();
    }

    public List<EnrollmentDTO> listBySection(Long sectionId) {
        return enrollmentRepository.findBySectionId(sectionId).stream()
                .sorted(Comparator.comparing(Enrollment::getEnrolledAt))
                .map(this::toDTO)
                .toList();
    }

    /**
     * Lecturer sets a grade. Authorization: user must be a lecturer on any section of the
     * offering this enrollment belongs to, OR an admin.
     */
    @Transactional
    public EnrollmentDTO setGrade(Long enrollmentId, Grade grade, User actor) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Enrollment " + enrollmentId + " not found"));

        authorizeLecturerOrAdmin(actor, enrollment.getSection().getOffering().getId());

        if (enrollment.getStatus() == EnrollmentStatus.WITHDRAWN) {
            throw new BadRequestException("Cannot grade a withdrawn enrollment.");
        }

        enrollment.setGrade(grade);
        return toDTO(enrollmentRepository.save(enrollment));
    }

    /**
     * Release every set-but-unreleased grade across all sections of an offering.
     * Authorization: any lecturer assigned to any section on the offering, or admin.
     */
    @Transactional
    public int releaseGradesForOffering(Long offeringId, User actor) {
        CourseOffering offering = courseOfferingRepository.findById(offeringId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Course offering " + offeringId + " not found"));

        authorizeLecturerOrAdmin(actor, offeringId);

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
                            + " (" + e.getSection().getLabel() + ") is now available in your transcript.",
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
            Double credits = e.getSection().getOffering().getCredits();
            if (credits == null) continue;
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

    private void authorizeLecturerOrAdmin(User actor, Long offeringId) {
        if (actor.getRole() == Role.ADMIN) return;
        if (actor.getRole() == Role.LECTURER
                && courseSectionRepository.isLecturerOnOffering(offeringId, actor.getId())) {
            return;
        }
        throw new BadRequestException(
                "Only lecturers assigned to this offering (or admins) can perform this action.");
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
                .map(e -> e.getSection().getOffering().getCode())
                .collect(Collectors.toSet());

        return required.stream()
                .filter(code -> !passed.contains(code))
                .toList();
    }

    private EnrollmentDTO toDTO(Enrollment e) {
        CourseSection section = e.getSection();
        CourseOffering offering = section.getOffering();
        return EnrollmentDTO.builder()
                .id(e.getId())
                .studentId(e.getStudent().getId())
                .studentName(e.getStudent().getName())
                .studentEmail(e.getStudent().getEmail())
                .studentRegistrationNumber(e.getStudent().getStudentRegistrationNumber())
                .sectionId(section.getId())
                .sectionLabel(section.getLabel())
                .sectionCapacity(section.getCapacity())
                .lecturerId(section.getLecturer() != null ? section.getLecturer().getId() : null)
                .lecturerName(section.getLecturer() != null ? section.getLecturer().getName() : null)
                .offeringId(offering.getId())
                .courseCode(offering.getCode())
                .courseTitle(offering.getTitle())
                .semester(offering.getSemester())
                .credits(offering.getCredits())
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
