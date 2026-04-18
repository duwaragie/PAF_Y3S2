package com.smartcampus.api.service.notification;

import com.smartcampus.api.model.NotificationChannelType;

/**
 * A delivery channel (in-app, email, push). The dispatcher fans out to every
 * channel whose toggle is ON for the recipient + notification type.
 */
public interface NotificationChannel {

    NotificationChannelType type();

    /**
     * Deliver the notification. Implementations must not throw — swallow and log
     * per-channel failures so one broken channel can't block the others.
     */
    void send(NotificationRequest request);
}
