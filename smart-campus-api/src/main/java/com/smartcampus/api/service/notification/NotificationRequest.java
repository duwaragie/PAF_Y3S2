package com.smartcampus.api.service.notification;

import com.smartcampus.api.model.NotificationPriority;
import com.smartcampus.api.model.NotificationType;
import com.smartcampus.api.model.User;
import lombok.Builder;
import lombok.Value;

/**
 * Immutable notification payload passed from the dispatcher to each channel.
 */
@Value
@Builder
public class NotificationRequest {
    User recipient;
    NotificationType type;
    NotificationPriority priority;
    String title;
    String message;
    /** Deep link into the app (optional). */
    String link;
}
