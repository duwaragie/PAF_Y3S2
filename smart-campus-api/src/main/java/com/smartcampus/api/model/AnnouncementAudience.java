package com.smartcampus.api.model;

/**
 * Who receives a scheduled broadcast. ALL sends to every user; the role
 * values narrow to that role only.
 */
public enum AnnouncementAudience {
    ALL,
    STUDENT,
    LECTURER,
    ADMIN
}
