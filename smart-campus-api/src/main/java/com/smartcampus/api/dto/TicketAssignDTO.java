package com.smartcampus.api.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TicketAssignDTO {

    @NotNull(message = "Assignee user ID is required")
    private Long assignedToId;
}
