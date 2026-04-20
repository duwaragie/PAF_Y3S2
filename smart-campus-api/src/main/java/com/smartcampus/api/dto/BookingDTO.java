package com.smartcampus.api.dto;

import com.smartcampus.api.model.BookingStatus;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingDTO {
    private Long id;
    private Long userId;
    private String userName;
    private String userEmail;
    private Long resourceId;
    private String resourceName;
    private String locationName;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String purpose;
    private Integer expectedAttendees;
    private BookingStatus status;
    private String rejectionReason;
    private Long approvedById;
    private String approvedByName;
    private LocalDateTime requestedAt;
    private LocalDateTime updatedAt;
    private LocalDateTime approvedAt;
    private LocalDateTime cancelledAt;
    private LocalDateTime completedAt;
    private Long cancelledById;
    private String cancelledByName;
    private String adminCancelReason;
    private Boolean canEdit;
    private Boolean canCancel;
    private Boolean canReview;
}
