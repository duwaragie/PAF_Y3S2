package com.smartcampus.api.dto;

import com.smartcampus.api.model.CourseOfferingStatus;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateCourseOfferingRequest {
    @NotBlank(message = "Course code is required")
    @Size(max = 32, message = "Course code is too long")
    private String code;

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotBlank(message = "Semester is required")
    @Size(max = 32)
    private String semester;

    @NotNull(message = "Credits are required")
    @DecimalMin(value = "0.5", message = "Credits must be at least 0.5")
    @DecimalMax(value = "12.0", message = "Credits cannot exceed 12")
    private Double credits;

    /** Comma-separated course codes required before enrolling. */
    private String prerequisites;

    private CourseOfferingStatus status;
}
