package com.smartcampus.api.service;

import com.smartcampus.api.dto.LecturerDashboardSummary;
import com.smartcampus.api.dto.StudentDashboardSummary;
import com.smartcampus.api.model.CourseSection;
import com.smartcampus.api.model.Enrollment;
import com.smartcampus.api.model.EnrollmentStatus;
import com.smartcampus.api.repository.CourseSectionRepository;
import com.smartcampus.api.repository.EnrollmentRepository;
import com.smartcampus.api.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final EnrollmentRepository enrollmentRepository;
    private final CourseSectionRepository courseSectionRepository;
    private final NotificationRepository notificationRepository;

    public StudentDashboardSummary studentSummary(Long studentId) {
        List<Enrollment> mine = enrollmentRepository.findByStudentId(studentId);

        int active = (int) mine.stream().filter(e -> e.getStatus() == EnrollmentStatus.ENROLLED).count();
        int waitlisted = (int) mine.stream().filter(e -> e.getStatus() == EnrollmentStatus.WAITLISTED).count();

        List<Enrollment> gpaEligible = mine.stream()
                .filter(e -> e.getStatus() == EnrollmentStatus.COMPLETED)
                .filter(e -> Boolean.TRUE.equals(e.getGradeReleased()))
                .filter(e -> e.getGrade() != null && e.getGrade().isCountsForGpa())
                .toList();

        double totalPoints = 0.0;
        double totalCredits = 0.0;
        for (Enrollment e : gpaEligible) {
            Double credits = e.getSection().getOffering().getCredits();
            Double points = e.getGrade().getGpaPoints();
            if (credits == null || points == null) continue;
            totalPoints += points * credits;
            totalCredits += credits;
        }
        double gpa = totalCredits > 0 ? round2(totalPoints / totalCredits) : 0.0;

        long unread = notificationRepository.countByRecipientIdAndReadFalse(studentId);

        return StudentDashboardSummary.builder()
                .activeEnrollments(active)
                .waitlisted(waitlisted)
                .coursesCompleted(gpaEligible.size())
                .gpa(gpa)
                .creditsEarned(round2(totalCredits))
                .unreadNotifications(unread)
                .build();
    }

    public LecturerDashboardSummary lecturerSummary(Long lecturerId) {
        List<CourseSection> sections = courseSectionRepository.findByLecturerId(lecturerId);
        List<Enrollment> enrollments = enrollmentRepository.findForLecturer(lecturerId);

        int totalStudents = (int) enrollments.stream()
                .filter(e -> e.getStatus() == EnrollmentStatus.ENROLLED
                        || e.getStatus() == EnrollmentStatus.COMPLETED)
                .count();

        int pendingGrades = (int) enrollments.stream()
                .filter(e -> e.getStatus() == EnrollmentStatus.ENROLLED)
                .filter(e -> e.getGrade() == null)
                .count();

        int gradedPendingRelease = (int) enrollments.stream()
                .filter(e -> e.getStatus() == EnrollmentStatus.ENROLLED)
                .filter(e -> e.getGrade() != null)
                .filter(e -> !Boolean.TRUE.equals(e.getGradeReleased()))
                .count();

        int released = (int) enrollments.stream()
                .filter(e -> Boolean.TRUE.equals(e.getGradeReleased()))
                .count();

        List<String> offeringCodes = sections.stream()
                .map(s -> s.getOffering().getCode())
                .distinct()
                .sorted()
                .toList();

        long offeringsCount = sections.stream()
                .map(s -> s.getOffering().getId())
                .collect(Collectors.toSet())
                .size();

        long unread = notificationRepository.countByRecipientIdAndReadFalse(lecturerId);

        return LecturerDashboardSummary.builder()
                .sectionsInCharge(sections.size())
                .offeringsInCharge((int) offeringsCount)
                .totalStudents(totalStudents)
                .pendingGrades(pendingGrades)
                .gradedPendingRelease(gradedPendingRelease)
                .releasedGrades(released)
                .unreadNotifications(unread)
                .courseCodes(offeringCodes)
                .build();
    }

    private double round2(double d) {
        return Math.round(d * 100.0) / 100.0;
    }
}
