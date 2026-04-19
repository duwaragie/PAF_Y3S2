package com.smartcampus.api.dto;

import com.smartcampus.api.model.TicketStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TicketStatusUpdateDTO {

    @NotNull(message = "Status is required")
    private TicketStatus status;

    private String rejectionReason;
    private String resolutionNotes;
}
