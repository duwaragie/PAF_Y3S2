package com.smartcampus.api.dto;

import com.smartcampus.api.model.TicketCategory;
import com.smartcampus.api.model.TicketPriority;
import com.smartcampus.api.model.TicketStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TicketResponseDTO {
    private Long id;
    private String title;
    private String location;
    private TicketCategory category;
    private String description;
    private TicketPriority priority;
    private TicketStatus status;
    private String preferredContactEmail;
    private String preferredContactPhone;
    private String rejectionReason;
    private String resolutionNotes;
    private Long createdById;
    private String createdByName;
    private Long assignedToId;
    private String assignedToName;
    private List<Long> imageIds;
    private List<TicketCommentResponseDTO> comments;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
