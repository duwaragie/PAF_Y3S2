package com.smartcampus.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseSectionDTO {
    private Long id;
    private Long offeringId;
    private String courseCode;
    private String courseTitle;
    private String semester;
    private Double credits;
    private String label;
    private Integer capacity;
    private Integer enrolledCount;
    private Integer seatsAvailable;
    private Long lecturerId;
    private String lecturerName;
}
