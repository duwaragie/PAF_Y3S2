package com.smartcampus.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LecturerDashboardSummary {
    /** Distinct sections this lecturer owns. */
    private int sectionsInCharge;
    /** Distinct offerings across those sections. */
    private int offeringsInCharge;
    /** Total students across all sections (ENROLLED + COMPLETED). */
    private int totalStudents;
    /** Students enrolled but not yet graded. */
    private int pendingGrades;
    /** Grades set but not released. */
    private int gradedPendingRelease;
    /** Grades released. */
    private int releasedGrades;
    /** Unread notifications. */
    private long unreadNotifications;
    /** Course codes this lecturer teaches this semester (for quick display). */
    private List<String> courseCodes;
}
