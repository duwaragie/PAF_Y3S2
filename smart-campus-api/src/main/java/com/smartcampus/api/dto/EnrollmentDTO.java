package com.smartcampus.api.dto;

import com.smartcampus.api.model.EnrollmentStatus;
import com.smartcampus.api.model.Grade;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnrollmentDTO {
    private Long id;
    private Long studentId;
    private String studentName;
    private String studentEmail;
    private String studentRegistrationNumber;

    private Long offeringId;
    private String courseCode;
    private String courseTitle;
    private String semester;
    private Double credits;

    private EnrollmentStatus status;
    private Grade grade;
    private String gradeLabel;
    private Double gradePoints;
    private Boolean gradeReleased;
    private LocalDateTime gradeReleasedAt;

    private LocalDateTime enrolledAt;
    private LocalDateTime withdrawnAt;
}
