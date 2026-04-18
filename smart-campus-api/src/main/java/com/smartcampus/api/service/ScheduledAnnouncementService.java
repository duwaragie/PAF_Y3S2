package com.smartcampus.api.service;

import com.smartcampus.api.dto.CreateScheduledAnnouncementRequest;
import com.smartcampus.api.dto.ScheduledAnnouncementDTO;
import com.smartcampus.api.exception.BadRequestException;
import com.smartcampus.api.exception.ResourceNotFoundException;
import com.smartcampus.api.model.AnnouncementAudience;
import com.smartcampus.api.model.NotificationType;
import com.smartcampus.api.model.Role;
import com.smartcampus.api.model.ScheduledAnnouncement;
import com.smartcampus.api.model.User;
import com.smartcampus.api.repository.ScheduledAnnouncementRepository;
import com.smartcampus.api.repository.UserRepository;
import com.smartcampus.api.service.notification.NotificationDispatcher;
import com.smartcampus.api.service.notification.NotificationRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Creates, lists, cancels and dispatches scheduled broadcast announcements.
 * A cron job every minute picks up rows whose scheduledAt has passed and
 * fans them out to every targeted user via the notification dispatcher.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ScheduledAnnouncementService {

    private final ScheduledAnnouncementRepository repository;
    private final UserRepository userRepository;
    private final NotificationDispatcher dispatcher;

    @Transactional
    public ScheduledAnnouncementDTO create(User admin, CreateScheduledAnnouncementRequest req) {
        if (req.getScheduledAt().isBefore(LocalDateTime.now().minusMinutes(1))) {
            throw new BadRequestException("scheduledAt must be in the future");
        }
        ScheduledAnnouncement saved = repository.save(ScheduledAnnouncement.builder()
                .title(req.getTitle())
                .message(req.getMessage())
                .link(req.getLink())
                .priority(req.getPriority())
                .audience(req.getAudience())
                .scheduledAt(req.getScheduledAt())
                .createdBy(admin)
                .build());
        return toDTO(saved);
    }

    @Transactional(readOnly = true)
    public List<ScheduledAnnouncementDTO> listAll() {
        return repository.findAllByOrderByScheduledAtDesc()
                .stream().map(this::toDTO).toList();
    }

    @Transactional
    public void cancel(Long id) {
        ScheduledAnnouncement announcement = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Announcement " + id + " not found"));
        if (announcement.getSentAt() != null) {
            throw new BadRequestException("Cannot cancel — announcement already sent");
        }
        repository.delete(announcement);
    }

    /**
     * Cron: fires at the top of every wall-clock minute (:00 second mark)
     * and dispatches any announcements whose scheduledAt has passed.
     * Max latency is ~1 minute — predictable for demos and good enough for
     * a 50-user scale.
     */
    @Scheduled(cron = "0 * * * * *")
    @Transactional
    public void dispatchDue() {
        List<ScheduledAnnouncement> due = repository.findDue(LocalDateTime.now());
        if (due.isEmpty()) return;
        for (ScheduledAnnouncement announcement : due) {
            try {
                int count = fanOut(announcement);
                announcement.setSentAt(LocalDateTime.now());
                announcement.setRecipientCount(count);
                repository.save(announcement);
                log.info("Announcement {} dispatched to {} users", announcement.getId(), count);
            } catch (Exception e) {
                log.error("Failed to dispatch announcement {}: {}",
                        announcement.getId(), e.getMessage(), e);
            }
        }
    }

    private int fanOut(ScheduledAnnouncement announcement) {
        List<User> recipients = resolveRecipients(announcement.getAudience());
        for (User u : recipients) {
            dispatcher.dispatch(NotificationRequest.builder()
                    .recipient(u)
                    .type(NotificationType.SYSTEM_ANNOUNCEMENT)
                    .priority(announcement.getPriority())
                    .title(announcement.getTitle())
                    .message(announcement.getMessage())
                    .link(announcement.getLink())
                    .build());
        }
        return recipients.size();
    }

    private List<User> resolveRecipients(AnnouncementAudience audience) {
        return switch (audience) {
            case ALL -> userRepository.findAll();
            case STUDENT -> userRepository.findByRole(Role.STUDENT);
            case LECTURER -> userRepository.findByRole(Role.LECTURER);
            case ADMIN -> userRepository.findByRole(Role.ADMIN);
        };
    }

    private ScheduledAnnouncementDTO toDTO(ScheduledAnnouncement a) {
        return ScheduledAnnouncementDTO.builder()
                .id(a.getId())
                .title(a.getTitle())
                .message(a.getMessage())
                .link(a.getLink())
                .priority(a.getPriority())
                .audience(a.getAudience())
                .scheduledAt(a.getScheduledAt())
                .sentAt(a.getSentAt())
                .recipientCount(a.getRecipientCount())
                .createdByName(a.getCreatedBy() != null ? a.getCreatedBy().getName() : null)
                .createdAt(a.getCreatedAt())
                .build();
    }
}
