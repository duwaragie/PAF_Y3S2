package com.smartcampus.api.dto;

import com.smartcampus.api.model.CourseOfferingStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
    private Integer capacity;
    private Integer enrolledCount;
    private Integer seatsAvailable;
    private Long lecturerId;
    private String lecturerName;
    private String prerequisites;
    private CourseOfferingStatus status;
}
