package com.smartcampus.api.dto;

import com.smartcampus.api.model.Grade;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SetGradeRequest {
    @NotNull(message = "Grade is required")
    private Grade grade;
}
