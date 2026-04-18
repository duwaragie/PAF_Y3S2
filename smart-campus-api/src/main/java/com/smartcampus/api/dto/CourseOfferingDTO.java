package com.smartcampus.api.dto;

import com.smartcampus.api.model.CourseOfferingStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseOfferingDTO {
    private Long id;
    private String code;
    private String title;
    private String description;
    private String semester;
    private Double credits;
    private String prerequisites;
    private CourseOfferingStatus status;

    /** Sections under this offering, each with its own lecturer and capacity. */
    private List<CourseSectionDTO> sections;

    /** Sum of capacity across all sections. */
    private Integer totalCapacity;

    /** Sum of ENROLLED + COMPLETED enrollments across all sections. */
    private Integer totalEnrolled;

    /** Distinct lecturer names from sections, comma-separated, for quick display. */
    private String lecturerNames;
}
