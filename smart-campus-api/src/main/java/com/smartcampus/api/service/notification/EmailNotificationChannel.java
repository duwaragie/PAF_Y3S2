package com.smartcampus.api.service.notification;

import com.smartcampus.api.model.NotificationChannelType;
import com.smartcampus.api.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class EmailNotificationChannel implements NotificationChannel {

    private final EmailService emailService;

    @Override
    public NotificationChannelType type() {
        return NotificationChannelType.EMAIL;
    }

    @Override
    public void send(NotificationRequest request) {
        if (request.getRecipient().getEmail() == null) return;
        try {
            emailService.sendNotificationEmail(
                    request.getRecipient().getEmail(),
                    request.getRecipient().getName(),
                    request.getTitle(),
                    request.getMessage(),
                    request.getLink());
        } catch (Exception e) {
            log.warn("Email notification failed for {}: {}",
                    request.getRecipient().getEmail(), e.getMessage());
        }
    }
}
