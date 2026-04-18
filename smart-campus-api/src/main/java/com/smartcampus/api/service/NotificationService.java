package com.smartcampus.api.service;

import com.smartcampus.api.dto.NotificationDTO;
import com.smartcampus.api.exception.ResourceNotFoundException;
import com.smartcampus.api.model.Notification;
import com.smartcampus.api.model.NotificationPriority;
import com.smartcampus.api.model.NotificationType;
import com.smartcampus.api.model.User;
import com.smartcampus.api.repository.NotificationRepository;
import com.smartcampus.api.service.notification.NotificationDispatcher;
import com.smartcampus.api.service.notification.NotificationRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationDispatcher dispatcher;

    /**
     * Facade over {@link NotificationDispatcher}. Existing call sites keep working;
     * the actual routing (in-app / email / push) happens inside the dispatcher
     * based on the recipient's preferences.
     */
    public void notify(User recipient,
                       NotificationType type,
                       NotificationPriority priority,
                       String title,
                       String message,
                       String link) {
        dispatcher.dispatch(NotificationRequest.builder()
                .recipient(recipient)
                .type(type)
                .priority(priority)
                .title(title)
                .message(message)
                .link(link)
                .build());
    }

    public List<NotificationDTO> listForUser(Long userId, int limit) {
        Pageable pageable = PageRequest.of(0, Math.min(Math.max(limit, 1), 100));
        return notificationRepository
                .findByRecipientIdOrderByCreatedAtDesc(userId, pageable)
                .stream().map(this::toDTO).toList();
    }

    public long unreadCount(Long userId) {
        return notificationRepository.countByRecipientIdAndReadFalse(userId);
    }

    @Transactional
    public NotificationDTO markRead(Long userId, Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Notification " + notificationId + " not found"));
        if (!notification.getRecipient().getId().equals(userId)) {
            throw new ResourceNotFoundException("Notification " + notificationId + " not found");
        }
        if (!Boolean.TRUE.equals(notification.getRead())) {
            notification.setRead(true);
            notification.setReadAt(LocalDateTime.now());
            notification = notificationRepository.save(notification);
        }
        return toDTO(notification);
    }

    @Transactional
    public int markAllRead(Long userId) {
        return notificationRepository.markAllReadForRecipient(userId, LocalDateTime.now());
    }

    @Transactional
    public void delete(Long userId, Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Notification " + notificationId + " not found"));
        if (!notification.getRecipient().getId().equals(userId)) {
            throw new ResourceNotFoundException("Notification " + notificationId + " not found");
        }
        notificationRepository.delete(notification);
    }

    private NotificationDTO toDTO(Notification n) {
        return NotificationDTO.builder()
                .id(n.getId())
                .type(n.getType())
                .priority(n.getPriority())
                .title(n.getTitle())
                .message(n.getMessage())
                .link(n.getLink())
                .read(n.getRead())
                .readAt(n.getReadAt())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
