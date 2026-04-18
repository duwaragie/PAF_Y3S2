package com.smartcampus.api.model;

public enum NotificationType {
    // Enrollments / academics
    ENROLLMENT_CONFIRMED,
    ENROLLMENT_WAITLISTED,
    WAITLIST_PROMOTED,
    ENROLLMENT_WITHDRAWN,
    GRADE_RELEASED,
    COURSE_STATUS_CHANGED,

    // Bookings
    BOOKING_CREATED,
    BOOKING_APPROVED,
    BOOKING_REJECTED,
    BOOKING_CANCELLED,

    // Tickets / incidents (wired when that module lands)
    TICKET_CREATED,
    TICKET_ASSIGNED,
    TICKET_UPDATED,
    TICKET_RESOLVED,

    // System-wide
    SYSTEM_ANNOUNCEMENT,
    ANNOUNCEMENT,
    GENERAL
}
