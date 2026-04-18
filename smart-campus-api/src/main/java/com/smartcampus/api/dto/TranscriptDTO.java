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
public class TranscriptDTO {
    private Long studentId;
    private String studentName;
    private String studentRegistrationNumber;

    /** GPA on a 4.0 scale across all COMPLETED courses with released grades. */
    private Double gpa;

    /** Sum of credits across all COMPLETED courses with released grades. */
    private Double creditsEarned;

    /** Number of completed courses counted in GPA. */
    private Integer coursesCompleted;

    /** All enrollments, in reverse-chronological order. */
    private List<EnrollmentDTO> entries;
}
