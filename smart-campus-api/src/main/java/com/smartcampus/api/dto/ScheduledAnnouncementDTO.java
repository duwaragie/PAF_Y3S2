package com.smartcampus.api.dto;

import com.smartcampus.api.model.AnnouncementAudience;
import com.smartcampus.api.model.NotificationPriority;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduledAnnouncementDTO {
    private Long id;
    private String title;
    private String message;
    private String link;
    private NotificationPriority priority;
    private AnnouncementAudience audience;
    private LocalDateTime scheduledAt;
    private LocalDateTime sentAt;
    private Integer recipientCount;
    private String createdByName;
    private LocalDateTime createdAt;
}
