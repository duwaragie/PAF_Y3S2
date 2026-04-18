package com.smartcampus.api.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EnrollRequest {
    @NotNull(message = "Course offering id is required")
    private Long courseOfferingId;
}
