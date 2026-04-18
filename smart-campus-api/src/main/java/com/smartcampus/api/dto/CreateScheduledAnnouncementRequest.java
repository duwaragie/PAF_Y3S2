package com.smartcampus.api.dto;

import com.smartcampus.api.model.AnnouncementAudience;
import com.smartcampus.api.model.NotificationPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CreateScheduledAnnouncementRequest {

    @NotBlank
    @Size(max = 255)
    private String title;

    @NotBlank
    @Size(max = 1000)
    private String message;

    @Size(max = 255)
    private String link;

    @NotNull
    private NotificationPriority priority;

    @NotNull
    private AnnouncementAudience audience;

    @NotNull
    private LocalDateTime scheduledAt;
}
