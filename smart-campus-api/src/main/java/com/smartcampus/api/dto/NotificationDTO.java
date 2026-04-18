package com.smartcampus.api.dto;

import com.smartcampus.api.model.NotificationPriority;
import com.smartcampus.api.model.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDTO {
    private Long id;
    private NotificationType type;
    private NotificationPriority priority;
    private String title;
    private String message;
    private String link;
    private Boolean read;
    private LocalDateTime readAt;
    private LocalDateTime createdAt;
}
