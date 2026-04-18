package com.smartcampus.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentDashboardSummary {
    /** Active enrollments right now (status ENROLLED). */
    private int activeEnrollments;
    /** Currently on waitlists. */
    private int waitlisted;
    /** Completed courses with released grades (counted toward GPA). */
    private int coursesCompleted;
    /** Cumulative GPA on a 4.0 scale. */
    private double gpa;
    /** Credits earned to date. */
    private double creditsEarned;
    /** Unread notifications. */
    private long unreadNotifications;
}
