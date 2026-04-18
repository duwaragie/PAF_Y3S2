package com.smartcampus.api.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateCourseSectionRequest {

    @NotBlank(message = "Section label is required")
    @Size(max = 32, message = "Label is too long")
    private String label;

    @NotNull(message = "Capacity is required")
    @Min(value = 1, message = "Capacity must be at least 1")
    private Integer capacity;

    /** Lecturer can be assigned later; nullable for DRAFT creation. */
    private Long lecturerId;
}
